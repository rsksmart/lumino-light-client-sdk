import { ethers } from "ethers";
import {
  MessageType,
  MessageKeyForOrder,
  LIGHT_MESSAGE_TYPE,
} from "../config/messagesConstants";
import { FAILURE_REASONS } from "../config/paymentConstants";
import {
  getPendingPaymentById,
  paymentExistsInAnyState,
  getChannelByIdAndToken,
  getPaymentIds,
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
} from "../store/actions/payment";
import { saveLuminoData } from "../store/actions/storage";
import {
  signatureRecover,
  isAddressFromPayment,
  validateReceptionLT,
  senderIsSigner,
} from "./validators";
import {
  CREATE_PAYMENT,
  RECEIVED_PAYMENT,
  SET_SECRET_MESSAGE_ID,
} from "../store/actions/types";
import Lumino from "../Lumino/index";
import { searchTokenDataInChannels } from "../store/functions/tokens";
import { getPaymentByIdAndState } from "../store/functions/payments";

/**
 *
 * @param {*} messages The messages to process
 */
export const messageManager = messages => {
  // We filter out only payment messages for this flow

  const paymentMessages = [];
  const nonPaymentMessages = [];
  messages.forEach(m => {
    if ((m.message_type = LIGHT_MESSAGE_TYPE.PAYMENT_OK_FLOW))
      return paymentMessages.push(m);
    return nonPaymentMessages.push(m);
  });
  const sortedNonPaymentMsg = nonPaymentMessages.sort(
    (a, b) => a.internal_msg_identifier - b.internal_msg_identifier
  );
  manageNonPaymentMessages(sortedNonPaymentMsg);

  // We sort them by their order
  const sortedPaymentMsg = paymentMessages.sort(
    (a, b) => a.message_order - b.message_order
  );

  managePaymentMessages(sortedPaymentMsg);
};

const manageNonPaymentMessages = messages => {
  // const { getAddress } = ethers.utils;
  messages.forEach(({ message_content: msg, message_type }) => {
    const paymentState = paymentExistsInAnyState(msg.payment_id);
    const paymentData =
      paymentState && getPaymentByIdAndState(paymentState, msg.payment_id);
    const payment = paymentData ? { ...paymentData, paymentState } : null;
    switch (message_type) {
      case MessageType.LOCK_EXPIRED: {
        return manageLockExpired(msg, payment);
      }
    }
  });
};

const managePaymentMessages = messages => {
  const { getAddress } = ethers.utils;
  try {
    messages.forEach(({ message_content: msg }) => {
      const { payment_id, is_signed } = msg;
      // TODO: Remove this, now we manage everything as message
      const messageKey = "message";
      const { type } = msg[messageKey];
      const paymentId = payment_id.toString();
      const payment = getPendingPaymentById(paymentId);

      // We can't handle payments that don't exist OR failed, but we can handle reception of a new one
      if (!payment && type !== MessageType.LOCKED_TRANSFER) return null;
      // We have to check if a locked transfer may be from a payment that has been processed already
      if (type === MessageType.LOCKED_TRANSFER) {
        const hasPaymentInPendingOrComplete = getPaymentIds()[paymentId];
        if (hasPaymentInPendingOrComplete) return null;
      }
      if (is_signed && type !== MessageType.LOCKED_TRANSFER) {
        const signatureAddress = signatureRecover(msg[messageKey]);
        const { initiator, partner } = payment;
        if (!isAddressFromPayment(signatureAddress, initiator, partner))
          return null;
        if (getAddress(Lumino.getConfig().address) === signatureAddress)
          return null;
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

const manageLockExpired = (message, payment) => {
  const store = Store.getStore();
  if (!payment) {
    store.dispatch(recreatePaymentForFailure(message));
  }
  const paymentAux = getPendingPaymentById(message.payment_id);
  const { payment_id, paymentState } = paymentAux;
  store.dispatch(
    setPaymentFailed(payment_id, paymentState, FAILURE_REASONS.EXPIRED)
  );
  return store.dispatch(putLockExpired(message));
};

const manageLockedTransfer = (message, payment, messageKey) => {
  // We shouldn't have a payment, if the payment exists then the LT was processed
  if (payment) return null;
  const msg = message[messageKey];
  // Validate signature
  const signatureAddress = signatureRecover(msg);
  const { initiator } = msg;
  if (!senderIsSigner(signatureAddress, initiator)) return null;
  const { getAddress } = ethers.utils;
  // Check for our LT
  if (getAddress(Lumino.getConfig().address) === getAddress(msg.initiator))
    return null;
  if (paymentExistsInAnyState(msg.message_identifier)) return null;
  // If all ok validate the rest of params
  const channel = getChannelByIdAndToken(
    msg.channel_identifier,
    getAddress(msg.token)
  );
  const isValidLt = validateReceptionLT(msg, channel);
  if (isValidLt !== true) return console.warn(isValidLt);
  const store = Store.getStore();
  // This function add the message to the store in its proper order

  const { tokenName, tokenSymbol } = searchTokenDataInChannels(
    getAddress(msg.token)
  );
  const actionObj = {
    type: CREATE_PAYMENT,
    payment: {
      messages: {
        1: {
          payment_id: msg.message_identifier,
          message_order: 1,
          receiver: ethers.utils.getAddress(msg.target),
          sender: ethers.utils.getAddress(msg.initiator),
          message: { ...msg, message_order: 1 },
        },
      },
      isReceived: true,
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
      token: getAddress(msg.token),
    },
    paymentId: `${msg.payment_identifier}`,
    channelId: msg.channel_identifier,
    token: getAddress(msg.token),
  };
  store.dispatch(actionObj);
  store.dispatch({ type: RECEIVED_PAYMENT, payment: actionObj });
  store.dispatch(
    putDelivered(msg, actionObj.payment, message.message_order + 1, true)
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
  if (payment.messages[msg.message_order]) {
    // Message already processed
    return null;
  }

  const { message_order } = msg;
  const previousMessage = payment.messages[message_order - 1];
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
  // This function add the message to the store in its proper order
  store.dispatch(
    addPendingPaymentMessage(msg.payment_id, msg.message_order, {
      message: msg[messageKey],
      message_order: msg.message_order,
    })
  );
  if (msg[messageKey].type === MessageType.PROCESSED)
    return store.dispatch(
      putDelivered(msg[messageKey], payment, msg.message_order + 1)
    );
  return store.dispatch(saveLuminoData());
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
    const hasSameSecretHash =
      keccak256(msg[messageKey].secret) === payment.secret_hash;
    if (!hasSameSecretHash) return console.warn("Secret does not match");
    store.dispatch(
      addPendingPaymentMessage(msg.payment_id, msg.message_order, {
        message: msg[messageKey],
        message_order: msg.message_order,
      })
    );
    store.dispatch(setPaymentSecret(payment.paymentId, msg[messageKey].secret));
    return store.dispatch(saveLuminoData());
  } else {
    store.dispatch(
      addPendingPaymentMessage(msg.payment_id, msg.message_order, {
        message: msg[messageKey],
        message_order: msg.message_order,
      })
    );
    store.dispatch(putDelivered(payment.messages[7].message, payment, 8, true));
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
  store.dispatch(putDelivered(msg[messageKey], payment, 12, true));
  return store.dispatch(putProcessed(msg[messageKey], payment, 13));
};
