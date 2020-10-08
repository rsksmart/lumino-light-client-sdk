import { ethers } from "ethers";
import {
  MessageType,
  MessageKeyForOrder,
  LIGHT_MESSAGE_TYPE,
  PAYMENT_SUCCESSFUL,
} from "../config/messagesConstants";
import {
  FAILURE_REASONS,
  PENDING_PAYMENT,
  EXPIRED,
  REFUND_TRANSFER,
  FAILED_PAYMENT,
} from "../config/paymentConstants";
import {
  getPendingPaymentById,
  paymentExistsInAnyState,
  getChannelByIdAndToken,
} from "../store/functions";
import Store from "../store";
import {
  addPendingPaymentMessage,
  putDelivered,
  putRevealSecret,
  putBalanceProof,
  putProcessed,
  putSecretRequest,
  setPaymentSecret,
  putNonClosingBalanceProof,
  setPaymentFailed,
  recreatePaymentForFailure,
  putLockExpired,
  addExpiredPaymentMessage,
  createPayment,
  addRefundPaymentMessage,
} from "../store/actions/payment";
import { saveLuminoData } from "../store/actions/storage";
import {
  signatureRecover,
  isAddressFromPayment,
  validateReceptionLT,
  senderIsSigner,
  isAddressFromMediator,
} from "./validators";
import {
  CREATE_PAYMENT,
  RECEIVED_PAYMENT,
  SET_SECRET_MESSAGE_ID,
} from "../store/actions/types";
import Lumino from "../Lumino/index";
import {
  getTokenAddressByTokenNetwork,
  searchTokenDataInChannels,
} from "../store/functions/tokens";
import {
  getPaymentByIdAndState,
  isPaymentCompleteOrPending,
} from "../store/functions/payments";
import { chkSum } from "../utils/functions";
import { settleChannel } from "../store/actions/settle";
import { registerSecret } from "../store/actions/secret";
import { unlockChannel } from "../store/actions/unlock";

/**
 *
 * @param {*} messages The messages to process
 */
export const messageManager = (messages = []) => {
  // We filter out only payment messages for this flow

  const paymentMessages = [];
  const nonPaymentMessages = [];
  if (!Array.isArray(messages)) return;
  messages.forEach(m => {
    if (m.message_type === LIGHT_MESSAGE_TYPE.PAYMENT_OK_FLOW)
      return paymentMessages.push(m);
    return nonPaymentMessages.push(m);
  });
  const sortedNonPaymentMsg = nonPaymentMessages.sort(
    (a, b) => a.message_order - b.message_order
  );
  manageNonPaymentMessages(sortedNonPaymentMsg);

  // We sort them by their order
  const sortedPaymentMsg = paymentMessages.sort(
    (a, b) => a.message_order - b.message_order
  );

  managePaymentMessages(sortedPaymentMsg);
};

const getPayment = paymentId => {
  const paymentState = paymentExistsInAnyState(paymentId);
  if (!paymentState) return null;
  const paymentData = getPaymentByIdAndState(paymentState, paymentId);
  return paymentData;
};

const manageNonPaymentMessages = (messages = []) => {
  const messagesToProcessLast = [];

  messages.forEach(({ message_content: msg, internal_msg_identifier }) => {
    const { payment_id } = msg;
    let payment = getPayment(payment_id);

    switch (msg.message.type) {
      case MessageType.LOCK_EXPIRED: {
        return manageLockExpired(msg, payment);
      }
      case MessageType.DELIVERED:
      case MessageType.PROCESSED: {
        return manageDeliveredAndProcessed(msg, payment, "message");
      }
      case MessageType.REFUND_TRANSFER: {
        return manageRefundTransfer(msg, payment);
      }
      case MessageType.LOCKED_TRANSFER: {
        return messagesToProcessLast.push(msg);
      }
      case MessageType.SETTLEMENT_REQUIRED: {
        return manageSettlementRequired(msg);
      }
      case MessageType.REQUEST_REGISTER_SECRET: {
        return manageRequestRegisterSecret({
          ...msg,
          internal_msg_identifier,
        });
      }
      case MessageType.UNLOCK_REQUEST: {
        return manageUnlockRequest(msg);
      }
    }
  });

  messagesToProcessLast.forEach(msg => {
    const { payment_id } = msg;
    const payment = getPayment(payment_id);
    switch (msg.message.type) {
      case MessageType.LOCKED_TRANSFER: {
        return manageLockedTransfer(msg, payment, "message");
      }
    }
  });
};

const manageUnlockRequest = async msg => {
  const { channel_identifier, token_address } = msg.message;
  const channel = getChannelByIdAndToken(channel_identifier, token_address);
  if (!channel) return;
  const { isUnlocked, isUnlocking } = channel;
  if (isUnlocked || isUnlocking) return;
  const store = Store.getStore();
  const { dispatch } = store;
  dispatch(unlockChannel(msg.message));
};

const manageSettlementRequired = async msg => {
  const { message } = msg;
  const { channel_identifier, channel_network_identifier } = message;
  const tokenNetwork = chkSum(channel_network_identifier);
  const token = getTokenAddressByTokenNetwork(tokenNetwork);
  const channel = getChannelByIdAndToken(channel_identifier, token);
  if (!channel) return console.error("Channel not found!");
  const { isSettled, isSettling } = channel;
  if (isSettled || isSettling) return;
  const { openedByUser, partner_address } = channel;
  const lcAddress = Lumino.getConfig().address;
  const creatorAddress = openedByUser ? lcAddress : partner_address;
  const partnerAddress = openedByUser ? partner_address : lcAddress;

  const txParams = {
    address: lcAddress,
    channelIdentifier: channel_identifier,
    tokenNetworkAddress: tokenNetwork,
    p1: {
      address: chkSum(message.participant1),
      transferred_amount: message.participant1_transferred_amount,
      locked_amount: message.participant1_locked_amount,
      locksroot: message.participant1_locksroot,
    },
    p2: {
      address: chkSum(message.participant2),
      transferred_amount: message.participant2_transferred_amount,
      locked_amount: message.participant2_locked_amount,
      locksroot: message.participant2_locksroot,
    },
  };
  // We need the signing handler, so we continue in an action;
  const store = Store.getStore();
  const { dispatch } = store;
  const settleData = {
    txParams,
    creatorAddress: chkSum(creatorAddress),
    partnerAddress: chkSum(partnerAddress),
  };
  dispatch(settleChannel(settleData));
};

const managePaymentMessages = (messages = []) => {
  const { getAddress } = ethers.utils;
  try {
    messages.forEach(({ message_content: msg }) => {
      const { payment_id, is_signed } = msg;

      const messageKey = "message";
      const { type } = msg[messageKey];
      const paymentId = payment_id.toString();
      const payment = getPendingPaymentById(paymentId);
      // We can't handle payments that don't exist , but we can handle reception of a new one
      if (!payment && type !== MessageType.LOCKED_TRANSFER) return null;
      // We have to check if a locked transfer may be from a payment that has been processed already
      if (type === MessageType.LOCKED_TRANSFER) {
        const paymentPendingOrComplete = isPaymentCompleteOrPending(paymentId);
        if (paymentPendingOrComplete) return null;
      }
      if (is_signed && type !== MessageType.LOCKED_TRANSFER) {
        const signAddress = signatureRecover(msg[messageKey]);
        const { initiator, partner, isMediated, mediator } = payment;
        const addressFromPayment = isAddressFromPayment(
          signAddress,
          initiator,
          partner
        );
        if (isMediated) {
          const addressFromMediator = isAddressFromMediator(
            signAddress,
            mediator
          );
          if (!addressFromPayment && !addressFromMediator) {
            return null;
          }
        } else {
          if (!addressFromPayment) return null;
        }

        if (getAddress(Lumino.getConfig().address) === signAddress) return null;
      }
      switch (type) {
        case MessageType.LOCKED_TRANSFER:
          return manageLockedTransfer(msg, payment, messageKey);
        case MessageType.DELIVERED:
        case MessageType.PROCESSED:
          return manageDeliveredAndProcessed(msg, payment, messageKey);
        case MessageType.SECRET_REQUEST:
          return manageSecretRequest(msg, payment, messageKey);
        case MessageType.SECRET:
          return manageSecret(msg, payment, messageKey);
        case MessageType.REVEAL_SECRET:
          return manageRevealSecret(msg, payment, messageKey);
        default:
          break;
      }
    });
  } catch (e) {
    console.warn(e);
  }
};

const manageRequestRegisterSecret = data => {
  const { payment_id, internal_msg_identifier } = data;
  const payment = getPayment(payment_id);
  if (!payment) return;
  const { registeringOnChainSecret, registeredOnChainSecret } = payment;
  // If it was registered or it is, do not do anything
  if (registeringOnChainSecret || registeredOnChainSecret) return;
  const store = Store.getStore();
  const { dispatch } = store;
  const { secret_registry_address } = data.message;
  const { secret } = payment;
  // Not having the secret should stop the execution. Since we shouldn't register something empty
  if (!secret) return;
  const dispatchData = {
    secretRegistryAddress: secret_registry_address,
    secret,
    paymentId: payment_id,
    internal_msg_identifier,
  };
  dispatch(registerSecret(dispatchData));
};

const manageLockExpired = (msgData, payment) => {
  const store = Store.getStore();
  const { dispatch } = store;
  const { message, payment_id, message_order } = msgData;

  if (!payment) {
    dispatch(
      recreatePaymentForFailure({
        ...message,
        payment_id,
      })
    );
  }

  const paymentAux = getPayment(payment_id);
  if (paymentAux.expiration && paymentAux.expiration.messages[1]) return null;
  const isFailed = !!paymentAux.failureReason;
  const paymentState = isFailed ? FAILED_PAYMENT : PENDING_PAYMENT;
  const { channelId, token } = paymentAux;
  const channelData = {
    channel_identifier: channelId,
    token_address: token,
  };
  dispatch(
    setPaymentFailed(
      payment_id,
      paymentState,
      FAILURE_REASONS.EXPIRED,
      channelData
    )
  );
  const dataForPut = {
    ...paymentAux,
    signature: message.signature,
    transferred_amount: message.transferred_amount,
    locked_amount: message.locked_amount,
    locksroot: message.locksroot,
    message_identifier: message.message_identifier,
    nonce: message.nonce,
  };

  // The payment is sent from the LC?
  dispatch(putLockExpired(dataForPut));
  if (!paymentAux.isReceived) return true;

  // The payment was sent to the LC
  dispatch(putDelivered(message, paymentAux, message_order + 1));
  return dispatch(putProcessed(message, paymentAux, 3));
};

const manageRefundTransfer = async (msgData, payment) => {
  const store = Store.getStore();
  const { dispatch } = store;
  const { message, payment_id, message_order } = msgData;

  const paymentAux = getPayment(payment_id);

  if (paymentAux.failureReason) return null;
  if (!paymentAux.failureReason) {
    dispatch(
      setPaymentFailed(
        payment_id,
        PENDING_PAYMENT,
        FAILURE_REASONS.REFUND_TRANSFER
      )
    );
    dispatch(
      addRefundPaymentMessage(payment_id, message_order, {
        message,
        message_order,
      })
    );
  }

  // We ACK that we have received and proccessed this.
  await dispatch(putDelivered(message, paymentAux, message_order + 1));
  await dispatch(putProcessed(message, paymentAux, 3));

  const { getAddress } = ethers.utils;

  const previousSecretHash = payment.secret_hash;

  const newPaymentParams = {
    previousSecretHash,
    amount: payment.amount,
    address: getAddress(payment.initiator),
    partner: getAddress(payment.partner),
    token_address: payment.token,
  };

  return dispatch(createPayment(newPaymentParams));
};

const manageLockedTransfer = (message, payment, messageKey) => {
  // We shouldn't have a payment, if the payment exists then the LT was processed

  if (payment && !payment.failureReason) return null;
  // For these cases, we just acknowledge the LT and stop processing
  const store = Store.getStore();
  const msg = message[messageKey];

  if (payment && payment.failureReason) {
    store.dispatch(
      putDelivered(msg, payment, message.message_order + 1, PAYMENT_SUCCESSFUL)
    );
    return store.dispatch(putProcessed(msg, payment, 3, PAYMENT_SUCCESSFUL));
  }

  // Validate signature
  const signatureAddress = signatureRecover(msg);
  const { initiator } = msg;

  const channel = getChannelByIdAndToken(
    msg.channel_identifier,
    chkSum(msg.token)
  );

  // We get the proper partner, and in case of them not being the initiator
  // We are on a mediated reception situation
  const partnerInChannel = chkSum(channel.partner_address);
  const isMediated = partnerInChannel !== chkSum(msg.initiator);
  const senderAddr = isMediated ? partnerInChannel : initiator;
  if (!senderIsSigner(signatureAddress, senderAddr)) return null;

  // Check for our LT
  if (chkSum(Lumino.getConfig().address) === chkSum(msg.initiator)) return null;
  if (paymentExistsInAnyState(msg.message_identifier)) return null;
  // If all ok validate the rest of params

  const isValidLt = validateReceptionLT(msg, channel);
  if (isValidLt !== true) return console.warn(isValidLt);
  // This function add the message to the store in its proper order

  const { tokenName, tokenSymbol } = searchTokenDataInChannels(
    chkSum(msg.token)
  );

  const actionObj = {
    type: CREATE_PAYMENT,
    payment: {
      messages: {
        1: {
          payment_id: msg.message_identifier,
          message_order: 1,
          receiver: chkSum(msg.target),
          sender: chkSum(msg.initiator),
          message: { ...msg, message_order: 1 },
        },
      },
      isReceived: true,
      isMediated,
      mediator: isMediated ? partnerInChannel : null,
      message_order: 1,
      tokenName,
      tokenSymbol,
      secret: "",
      partner: msg.target,
      paymentId: `${msg.payment_identifier}`,
      initiator: msg.initiator,
      amount: msg.lock.amount,
      secret_hash: msg.lock.secrethash,
      channelId: msg.channel_identifier,
      tokenNetworkAddress: msg.token_network_address,
      chainId: msg.chain_id,
      token: chkSum(msg.token),
    },
    paymentId: `${msg.payment_identifier}`,
    channelId: msg.channel_identifier,
    token: chkSum(msg.token),
  };
  store.dispatch(actionObj);
  store.dispatch({ type: RECEIVED_PAYMENT, payment: actionObj });
  store.dispatch(
    putDelivered(msg, actionObj.payment, message.message_order + 1)
  );
  store.dispatch(putProcessed(msg, actionObj.payment, 3));
};

/**
 *
 * @param {*} msg The message to manage
 * @param {*} payment The payment associated to the message
 * @param {*} messageKey The data key for accessing the message
 */
const manageDeliveredAndProcessed = (msg, payment, messageKey) => {
  const { failureReason } = payment;
  const { message_order } = msg;
  let previousMessage = null;
  const isExpired = failureReason === EXPIRED;
  const isRefunded = failureReason === REFUND_TRANSFER;

  // Message already processed?
  if (!isExpired && payment.messages[message_order]) return null;
  // Message already processed (Expired)?
  if (isExpired && payment.expiration.messages[message_order]) return null;

  if (!failureReason) previousMessage = payment.messages[message_order - 1];

  if (failureReason) {
    if (isExpired)
      previousMessage = payment.expiration.messages[message_order - 1];
    if (isRefunded)
      previousMessage = payment.refund.messages[message_order - 1];
  }

  if (!previousMessage) {
    return console.warn("Previous order of the message does not exist");
  }
  if (previousMessage.message_order === 0) return null;
  // Incoming message key
  const msgIdentifierKey = MessageKeyForOrder[msg.message_order];
  const previousMsgIdentifierKey =
    MessageKeyForOrder[previousMessage.message_order];

  const isSameIdentifier =
    previousMessage.message[previousMsgIdentifierKey].toString() ===
    msg[messageKey][msgIdentifierKey].toString();
  if (!isSameIdentifier) {
    return console.warn("Identifier of previous message does not match");
  }
  const store = Store.getStore();
  const { dispatch } = store;
  // This function add the message to the store in its proper order
  if (!failureReason)
    dispatch(
      addPendingPaymentMessage(msg.payment_id, msg.message_order, {
        message: msg[messageKey],
        message_order: msg.message_order,
      })
    );

  if (failureReason) {
    const failureMsgParams = [
      msg.payment_id,
      msg.message_order,
      {
        message: msg[messageKey],
        message_order: msg.message_order,
      },
    ];

    if (isExpired) dispatch(addExpiredPaymentMessage(...failureMsgParams));
    if (isRefunded) dispatch(addRefundPaymentMessage(...failureMsgParams));
  }
  if (msg[messageKey].type === MessageType.PROCESSED) {
    return dispatch(
      putDelivered(msg[messageKey], payment, msg.message_order + 1)
    );
  }
  return dispatch(saveLuminoData());
};

/**
 *
 * @param {*} msg The message to manage
 * @param {*} payment The payment associated to the message
 * @param {*} messageKey The data key for accessing the message
 */
const manageSecretRequest = (msg, payment, messageKey) => {
  if (payment.messages[msg.message_order]) {
    // Message already processed
    return null;
  }

  const hasSameSecretHash = msg[messageKey].secrethash === payment.secret_hash;
  if (!hasSameSecretHash) return console.warn("Secret hash does not match");

  const hasSameAmount = `${msg[messageKey].amount}` === `${payment.amount}`;
  if (!hasSameAmount) return console.warn("Amount does not match");

  const store = Store.getStore();
  // This function add the message to the store in its proper order
  store.dispatch(
    addPendingPaymentMessage(msg.payment_id, msg.message_order, {
      message: msg[messageKey],
      message_order: msg.message_order,
    })
  );
  // If we are receiving it, we just put the reveal secret
  if (!payment.messages[6] && !payment.isReceived) {
    store.dispatch(putDelivered(msg[messageKey], payment, 6));
  }
  if (!payment.isReceived) store.dispatch(putRevealSecret(payment));
  if (payment.isReceived)
    return store.dispatch(putSecretRequest(msg[messageKey], payment, true));
};

/**
 *
 * @param {*} msg The message to manage
 * @param {*} payment The payment associated to the message
 * @param {*} messageKey The data key for accessing the message
 */
const manageRevealSecret = (msg, payment, messageKey) => {
  if (payment.messages[msg.message_order]) {
    // Message already processed
    return null;
  }
  // If this is true, then we are on reception
  const store = Store.getStore();
  if (payment.secret && msg.is_signed) {
    const hasSameSecret = msg[messageKey].secret === payment.secret;
    if (!hasSameSecret) return console.warn("Secret does not match");

    store.dispatch(
      addPendingPaymentMessage(msg.payment_id, msg.message_order, {
        message: msg[messageKey],
        message_order: msg.message_order,
      })
    );
    if (!payment.messages[10]) {
      store.dispatch(putDelivered(msg[messageKey], payment, 10));
    }
  } else if (msg.message_order === 7) {
    const { keccak256 } = ethers.utils;
    const { secret } = msg[messageKey];
    const hasSameSecretHash = keccak256(secret) === payment.secret_hash;
    if (!hasSameSecretHash) return console.warn("Secret does not match");
    store.dispatch(
      addPendingPaymentMessage(msg.payment_id, msg.message_order, {
        message: msg[messageKey],
        message_order: msg.message_order,
      })
    );
    store.dispatch(setPaymentSecret(payment.paymentId, secret));
    const paymentAux = getPaymentByIdAndState(PENDING_PAYMENT, msg.payment_id);
    const dataToPack = paymentAux.messages[1].message;
    dataToPack.secret = secret;
    store.dispatch(
      putNonClosingBalanceProof(msg[messageKey], paymentAux, dataToPack)
    );
    return store.dispatch(saveLuminoData());
  } else {
    store.dispatch(
      addPendingPaymentMessage(msg.payment_id, msg.message_order, {
        message: msg[messageKey],
        message_order: msg.message_order,
      })
    );
    store.dispatch(putDelivered(payment.messages[7].message, payment, 8));
    store.dispatch(
      putRevealSecret(payment, msg[messageKey].message_identifier, 9, true)
    );
  }
};

/**
 *
 * @param {*} msg The message to manage
 * @param {*} payment The payment associated to the message
 * @param {*} messageKey The data key for accessing the message
 */
const manageSecret = (msg, payment, messageKey) => {
  //  Is already processed?
  if (payment.messages[msg.message_order]) return null;

  const hasSameChainId = msg[messageKey].chain_id === payment.chainId;

  if (!hasSameChainId) return console.warn("ChainId does not match");

  const hasSameSecret = msg[messageKey].secret === payment.secret;

  if (!hasSameSecret) return console.warn("Secret does not match");

  const hasSameChannelId =
    msg[messageKey].channel_identifier === payment.channelId;

  if (!hasSameChannelId) return console.warn("Channel Id does not match");

  const hasSameNetworkTokenAddress =
    msg[messageKey].token_network_address === payment.tokenNetworkAddress;

  if (!hasSameNetworkTokenAddress)
    return console.warn("Network Token Address does not match");

  const store = Store.getStore();
  store.dispatch(
    addPendingPaymentMessage(msg.payment_id, msg.message_order, {
      message: msg[messageKey],
      message_order: msg.message_order,
    })
  );

  store.dispatch({
    type: SET_SECRET_MESSAGE_ID,
    id: msg.message_order,
    paymentId: msg.payment_id,
  });
  // Put BP for sent payments
  if (!payment.isReceived)
    return store.dispatch(putBalanceProof(msg[messageKey], payment));
  store.dispatch(putNonClosingBalanceProof(msg[messageKey], payment));
  store.dispatch(putDelivered(msg[messageKey], payment, 12));
  return store.dispatch(putProcessed(msg[messageKey], payment, 13));
};
