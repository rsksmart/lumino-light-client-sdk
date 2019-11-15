import { MessageType, MessageKeyForOrder } from "../config/messagesConstants";
import { getPendingPaymentById } from "../store/functions";
import Store from "../store";
import {
  addPendingPaymentMessage,
  putDelivered,
  putRevealSecret,
  putBalanceProof,
} from "../store/actions/payment";
import { saveLuminoData } from "../store/actions/storage";
import { signatureRecover } from "./validators";

export const messageManager = messages => {
  try {
    const sortedMsgs = messages.sort(
      (a, b) => a.message_order - b.message_order
    );
    sortedMsgs.forEach(msg => {
      const { light_client_payment_id: identifier, is_signed } = msg;
      const paymentId = identifier.toString();
      const payment = getPendingPaymentById(paymentId);
      const messageSignedKey = is_signed
        ? "signed_message"
        : "unsigned_message";

      if (!payment) return null;

      const { type } = msg[messageSignedKey];

      // TODO: Use the next partner for getting the address and check signature
      // const partner = signatureRecover(msg[messageSignedKey]);
      switch (type) {
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

const manageDeliveredAndProcessed = (msg, payment, messageSignedKey) => {
  if (payment.messages[msg.message_order]) {
    return console.warn("That message order has been already processed in LC");
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
    `${previousMessage.message[previousMsgIdentifierKey]}` ===
    `${msg[messageSignedKey][msgIdentifierKey].toString()}`;
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

const manageSecretRequest = (msg, payment, messageSignedKey) => {
  if (payment.messages[msg.message_order]) {
    return console.warn("That message order has been already processed in LC");
  }
  const hasSameSecretHash =
    msg[messageSignedKey].secrethash === payment.secret_hash;
  if (!hasSameSecretHash) return console.warn("Secret hash does not match");
  const hasSameAmount =
    `${msg[messageSignedKey].amount}` === `${payment.amount}`;
  debugger;
  if (!hasSameAmount) return console.warn("Amount does not match");
  const store = Store.getStore();
  // This function add the message to the store in its proper order
  store.dispatch(
    addPendingPaymentMessage(msg.light_client_payment_id, msg.message_order, {
      message: msg[messageSignedKey],
      message_order: msg.message_order,
    })
  );
  if (!payment.messages[6]) {
    store.dispatch(putDelivered(msg[messageSignedKey], payment, 6));
  }
  return store.dispatch(putRevealSecret(payment));
};

const manageRevealSecret = (msg, payment, messageSignedKey) => {
  if (payment.messages[msg.message_order]) {
    return console.warn("That message order has been already processed in LC");
  }
  const hasSameSecret = msg[messageSignedKey].secret === payment.secret;
  if (!hasSameSecret) return console.warn("Secret does not match");
  const store = Store.getStore();

  store.dispatch(
    addPendingPaymentMessage(msg.light_client_payment_id, msg.message_order, {
      message: msg[messageSignedKey],
      message_order: msg.message_order,
    })
  );
  if (!payment.messages[10]) {
    store.dispatch(putDelivered(msg[messageSignedKey], payment, 10));
  }
};

const manageSecret = (msg, payment, messageSignedKey) => {
  if (payment.messages[msg.message_order]) {
    return console.warn("That message order has been already processed in LC");
  }
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
  // TODO: Amoutn should be something else right?
  // const hasSameAmount =
  //   `${msg[messageSignedKey].transferred_amount}` === `${payment.amount}`;
  // if (!hasSameAmount) return console.warn("Amount does not match");

  const store = Store.getStore();

  store.dispatch(
    addPendingPaymentMessage(
      msg.light_client_payment_id,
      msg.message_order,
      msg[messageSignedKey]
    )
  );

  store.dispatch(putBalanceProof(msg[messageSignedKey], payment));
};
