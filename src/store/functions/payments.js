import { ethers } from "ethers";

import {
  PAYMENT_SUCCESSFUL,
  PAYMENT_EXPIRED,
  PAYMENT_REFUND,
} from "../../config/messagesConstants";
import { EXPIRED, REFUND_TRANSFER } from "../../config/paymentConstants";
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
  return payments.pending[paymentId] || null;
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
    case REFUND_TRANSFER:
      return PAYMENT_REFUND;
    default:
      return null;
  }
};

export const getSenderAndReceiver = (payment, msgOrder = 0) => {
  const { isReceived, mediator, isMediated, failureReason } = payment;
  const { getAddress } = ethers.utils;
  const sender = isReceived ? payment.partner : payment.initiator;
  let receiver = isReceived ? payment.initiator : payment.partner;
  if (!sender || !receiver) return { sender: null, receiver: null };

  // Some custom logic must be processed in mediated payments

  if (isMediated) {
    // Non failed cases
    if (!failureReason && msgOrder) {
      const customReceiverOnOrder = {
        11: mediator,
        7: mediator,
      };
      if (customReceiverOnOrder[msgOrder])
        receiver = customReceiverOnOrder[msgOrder];
    }
    // Failed cases
    if (failureReason) receiver = mediator;
  }
  try {
    return {
      sender: getAddress(sender),
      receiver: getAddress(receiver),
      mediator,
    };
  } catch (error) {
    return { sender: null, receiver: null };
  }
};
