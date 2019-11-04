import { MessageType, MessageIdentifierKey } from "../config/messagesConstants";
import { getPendingPaymentById } from "../store/functions";
import Store from "../store";
import { addPaymentMessage } from "../store/actions/payment";

export const messageManager = messages => {
  messages.forEach(msg => {
    const { identifier } = msg;
    const payment = getPendingPaymentById(identifier);

    if (!payment) return null;

    const { type } = msg.message;

    switch (type) {
      case MessageType.DELIVERED:
      case MessageType.PROCESSED:
        return manageDeliveredAndProcessed(msg, payment);
      default:
        break;
    }
  });
};

const manageDeliveredAndProcessed = (msg, payment) => {
  if (payment.messages[msg.message_order]) {
    throw new Error("That message order has been already processed in LC");
  }
  const { message_order } = msg;
  const previousMessage = payment.messages[message_order - 1];
  if (!previousMessage) {
    throw new Error("Previous order of the message does not exist");
  }
  const msgIdentifierKey = MessageIdentifierKey[msg.message.type];
  const isSameIdentifier =
    `${previousMessage.message_identifier}` ===
    `${msg.message[msgIdentifierKey]}`;
  if (!isSameIdentifier) {
    throw new Error("Identifier of previous message does not match");
  }
  const store = Store.getStore();
  // This function add the message to the store in its proper order
  store.dispatch(
    addPaymentMessage(msg.identifier, msg.message_order, msg.message)
  );
  //   if (msg.type === MessageType.PROCESSED)
  // TODO: Do something to put the message
};
