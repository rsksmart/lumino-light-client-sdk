import { ethers } from "ethers";
import Store from "../index";
import {
  PAYMENT_SUCCESSFUL,
  PAYMENT_EXPIRED,
} from "../../config/messagesConstants";
import { EXPIRED } from "../../config/paymentConstants";

export const getPaymentIds = () => {
  const store = Store.getStore();
  const { paymentIds } = store.getState();
  return paymentIds;
};

export const getPendingPaymentById = paymentId => {
  const store = Store.getStore();
  const { payments } = store.getState();
  return payments.pending[paymentId];
};

export const getPendingPayments = () => {
  const store = Store.getStore();
  const { payments } = store.getState();
  return [...payments.pending];
};

export const paymentHasMessageOrder = (paymentId, order) => {
  const payment = getPendingPaymentById(paymentId);
  if (payment) return payment.messages[order];
  return false;
};

export const getPendingPaymentsKeyAndOrder = () => {
  const store = Store.getStore();
  const {
    payments: { pending },
  } = store.getState();
  const pendingKeys = Object.keys(pending);
  const pendingKeyPair = {};

  pendingKeys.forEach(e => {
    pendingKeyPair[`${e}`] = pending[`${e}`].message_order;
  });
  return pendingKeyPair;
};

export const paymentExistsInAnyState = paymentId => {
  const store = Store.getStore();
  const payments = store.getState().paymentIds;
  return payments[paymentId];
};

export const getPaymentByIdAndState = (state, paymentId) => {
  const store = Store.getStore();
  const { payments } = store.getState();
  if (payments[state.toLowerCase()])
    return payments[state.toLowerCase()][paymentId];
  return null;
};

export const getPaymentMessageTypeValue = payment => {
  const isFailed = payment.failureReason;
  if (!isFailed) return PAYMENT_SUCCESSFUL;
  switch (payment.failureReason) {
    case EXPIRED:
      return PAYMENT_EXPIRED;
    default:
      return null;
  }
};

export const getSenderAndReceiver = payment => {
  const { isReceived } = payment;
  const { getAddress } = ethers.utils;
  const sender = isReceived ? payment.partner : payment.initiator;
  const receiver = isReceived ? payment.initiator : payment.partner;
  return { sender: getAddress(sender), receiver: getAddress(receiver) };
};
