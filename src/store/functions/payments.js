import { ethers } from "ethers";

import {
  PAYMENT_SUCCESSFUL,
  PAYMENT_EXPIRED,
} from "../../config/messagesConstants";
import { EXPIRED } from "../../config/paymentConstants";
import { getState } from "./state";

export const getPaymentIds = () => {
  const { paymentIds } = getState();
  return paymentIds;
};

export const getAllPayments = () => {
  const { payments } = getState();
  return payments;
};

export const getPendingPaymentById = paymentId => {
  const payments = getAllPayments();
  if (payments && payments.pending) return payments.pending[paymentId] || null;
  return null;
};

export const getFailedPaymentById = paymentId => {
  const payments = getAllPayments();

  return payments.failed[paymentId];
};

export const getCompletedPaymentById = paymentId => {
  const payments = getAllPayments();
  return payments.completed[paymentId];
};

export const isPaymentCompleteOrPending = paymentId => {
  const completed = getCompletedPaymentById(paymentId);
  const pending = getPendingPaymentById(paymentId);
  return completed || pending;
};

/**
 * Checks the paymentsId stored and returns the state of the payment
 * @param {*} paymentId A paymentId
 */
export const paymentExistsInAnyState = paymentId => {
  const payments = getState().paymentIds;
  return payments[paymentId];
};

export const getPaymentByIdAndState = (state, paymentId) => {
  const { payments } = getState();
  if (payments[state.toLowerCase()] && payments[state.toLowerCase()][paymentId])
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
