import { MessageType, MessageKeyForOrder } from "../config/messagesConstants";
import {
  getPendingPaymentById,
  paymentExistsInAnyState,
  getChannelById,
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
import { ethers } from "ethers";
import Lumino from "../Lumino/index";

/**
 *
 * @param {*} messages The messages to process
 */
export const messageManager = messages => {
  try {
    const sortedMsgs = messages.sort(
      (a, b) => a.message_order - b.message_order
    );
    const { getAddress } = ethers.utils;
    sortedMsgs.forEach(msg => {
      const { light_client_payment_id: identifier, is_signed } = msg;
      const messageSignedKey = is_signed
        ? "signed_message"
        : "unsigned_message";
      const { type } = msg[messageSignedKey];
      const paymentId = identifier.toString();
      const payment = getPendingPaymentById(paymentId);

      // We can't handle payments that don't exist, but we can handle reception of a new one
      if (!payment && type !== MessageType.LOCKED_TRANSFER) return null;
      // We have to check if a locked transfer may be from a payment that has been processed already
      if (type === MessageType.LOCKED_TRANSFER) {
        const hasPaymentInPendingOrComplete = getPaymentIds()[paymentId];
        if (hasPaymentInPendingOrComplete) return null;
      }
      if (is_signed && type !== MessageType.LOCKED_TRANSFER) {
        const signatureAddress = signatureRecover(msg[messageSignedKey]);
        const { initiator, partner } = payment;
        if (!isAddressFromPayment(signatureAddress, initiator, partner))
          return null;
        if (getAddress(Lumino.getConfig().address) === signatureAddress)
          return null;
      }
      switch (type) {
        case MessageType.LOCKED_TRANSFER:
          return manageLockedTransfer(msg, payment, messageSignedKey);
        case MessageType.DELIVERED:
        case MessageType.PROCESSED:
          return manageDeliveredAndProcessed(msg, payment, messageSignedKey);
        case MessageType.SECRET_REQUEST:
          return manageSecretRequest(msg, payment, messageSignedKey);
        case MessageType.SECRET:
          return manageSecret(msg, payment, messageSignedKey);
        case MessageType.REVEAL_SECRET:
          return manageRevealSecret(msg, payment, messageSignedKey);
        default:
          break;
      }
    });
  } catch (e) {
    console.warn(e);
  }
};

const manageLockedTransfer = (message, payment, messageSignedKey) => {
  // We shouldn't have a payment, if the payment exists then the LT was processed
  if (payment) return null;
  const msg = message[messageSignedKey];
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
  const channel = getChannelById(msg.channel_identifier);
  validateReceptionLT(msg, channel);
  const store = Store.getStore();
  // This function add the message to the store in its proper order
  const actionObj = {
    type: CREATE_PAYMENT,
    payment: {
      messages: {
        1: {
          message_id: msg.message_identifier,
          message_order: 1,
          receiver: ethers.utils.getAddress(msg.target),
          sender: ethers.utils.getAddress(msg.initiator),
          message: { ...msg, message_order: 1 },
        },
      },
      isReceived: true,
      message_order: 1,
      secret: "",
      partner: msg.target,
      paymentId: `${msg.payment_identifier}`,
      initiator: msg.initiator,
      amount: msg.lock.amount,
      secret_hash: msg.lock.secrethash,
      channelId: msg.channel_identifier,
      tokenNetworkAddress: msg.token_network_address,
      chainId: msg.chain_id,
    },
    paymentId: `${msg.payment_identifier}`,
    channelId: msg.channel_identifier,
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
 * @param {*} messageSignedKey The data key for accessing the message
 */
const manageDeliveredAndProcessed = (msg, payment, messageSignedKey) => {
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
    msg[messageSignedKey][msgIdentifierKey].toString();
  if (!isSameIdentifier) {
    return console.warn("Identifier of previous message does not match");
  }
  const store = Store.getStore();
  // This function add the message to the store in its proper order
  store.dispatch(
    addPendingPaymentMessage(msg.light_client_payment_id, msg.message_order, {
      message: msg[messageSignedKey],
      message_order: msg.message_order,
    })
  );
  if (msg.signed_message.type === MessageType.PROCESSED)
    return store.dispatch(
      putDelivered(msg[messageSignedKey], payment, msg.message_order + 1)
    );
  return store.dispatch(saveLuminoData());
};

/**
 *
 * @param {*} msg The message to manage
 * @param {*} payment The payment associated to the message
 * @param {*} messageSignedKey The data key for accessing the message
 */
const manageSecretRequest = (msg, payment, messageSignedKey) => {
  if (payment.messages[msg.message_order]) {
    // Message already processed
    return null;
  }
  const hasSameSecretHash =
    msg[messageSignedKey].secrethash === payment.secret_hash;
  if (!hasSameSecretHash) return console.warn("Secret hash does not match");
  const hasSameAmount =
    `${msg[messageSignedKey].amount}` === `${payment.amount}`;
  if (!hasSameAmount) return console.warn("Amount does not match");
  const store = Store.getStore();
  // This function add the message to the store in its proper order
  store.dispatch(
    addPendingPaymentMessage(msg.light_client_payment_id, msg.message_order, {
      message: msg[messageSignedKey],
      message_order: msg.message_order,
    })
  );
  // If we are receiving it, we just put the reveal secret
  if (!payment.messages[6] && !payment.isReceived) {
    store.dispatch(putDelivered(msg[messageSignedKey], payment, 6));
  }
  if (!payment.isReceived) store.dispatch(putRevealSecret(payment));
  if (payment.isReceived)
    return store.dispatch(putSecretRequest(msg[messageSignedKey], payment));
};

/**
 *
 * @param {*} msg The message to manage
 * @param {*} payment The payment associated to the message
 * @param {*} messageSignedKey The data key for accessing the message
 */
const manageRevealSecret = (msg, payment, messageSignedKey) => {
  if (payment.messages[msg.message_order]) {
    // Message already processed
    return null;
  }
  // If this is true, then we are on reception
  const store = Store.getStore();
  if (payment.secret && msg.is_signed) {
    const hasSameSecret = msg[messageSignedKey].secret === payment.secret;
    if (!hasSameSecret) return console.warn("Secret does not match");

    store.dispatch(
      addPendingPaymentMessage(msg.light_client_payment_id, msg.message_order, {
        message: msg[messageSignedKey],
        message_order: msg.message_order,
      })
    );
    if (!payment.messages[10]) {
      store.dispatch(putDelivered(msg[messageSignedKey], payment, 10));
    }
  } else if (msg.message_order === 7) {
    const { keccak256 } = ethers.utils;
    const hasSameSecretHash =
      keccak256(msg[messageSignedKey].secret) === payment.secret_hash;
    if (!hasSameSecretHash) return console.warn("Secret does not match");
    store.dispatch(
      addPendingPaymentMessage(msg.light_client_payment_id, msg.message_order, {
        message: msg[messageSignedKey],
        message_order: msg.message_order,
      })
    );
    store.dispatch(
      setPaymentSecret(payment.paymentId, msg[messageSignedKey].secret)
    );
    return store.dispatch(saveLuminoData());
  } else {
    store.dispatch(
      addPendingPaymentMessage(msg.light_client_payment_id, msg.message_order, {
        message: msg[messageSignedKey],
        message_order: msg.message_order,
      })
    );
    store.dispatch(putDelivered(payment.messages[7].message, payment, 8, true));
    store.dispatch(
      putRevealSecret(
        payment,
        msg[messageSignedKey].message_identifier,
        9,
        true
      )
    );
  }
};

/**
 *
 * @param {*} msg The message to manage
 * @param {*} payment The payment associated to the message
 * @param {*} messageSignedKey The data key for accessing the message
 */
const manageSecret = (msg, payment, messageSignedKey) => {
  //  Is already processed?
  if (payment.messages[msg.message_order]) return null;

  const hasSameChainId = msg[messageSignedKey].chain_id === payment.chainId;

  if (!hasSameChainId) return console.warn("ChainId does not match");

  const hasSameSecret = msg[messageSignedKey].secret === payment.secret;

  if (!hasSameSecret) return console.warn("Secret does not match");

  const hasSameChannelId =
    msg[messageSignedKey].channel_identifier === payment.channelId;

  if (!hasSameChannelId) return console.warn("Channel Id does not match");

  const hasSameNetworkTokenAddress =
    msg[messageSignedKey].token_network_address === payment.tokenNetworkAddress;

  if (!hasSameNetworkTokenAddress)
    return console.warn("Network Token Address does not match");

  const store = Store.getStore();
  store.dispatch(
    addPendingPaymentMessage(msg.light_client_payment_id, msg.message_order, {
      message: msg[messageSignedKey],
      message_order: msg.message_order,
    })
  );

  store.dispatch({
    type: SET_SECRET_MESSAGE_ID,
    id: msg.message_order,
    paymentId: msg.light_client_payment_id,
  });
  // Put BP for sent payments
  if (!payment.isReceived)
    return store.dispatch(putBalanceProof(msg[messageSignedKey], payment));
  store.dispatch(putNonClosingBalanceProof(msg[messageSignedKey], payment));
  store.dispatch(putDelivered(msg[messageSignedKey], payment, 12, true));
  return store.dispatch(putProcessed(msg[messageSignedKey], payment, 13));
};
