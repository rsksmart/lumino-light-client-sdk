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
  const {
    isReceived,
    mediator,
    isMediated,
    initiator,
    partner,
    failureReason,
  } = payment;
  const { getAddress } = ethers.utils;
  // NOTE: Partner = the person that the payment was destined for
  // NOTE: initiator = the person that created the payment
  // We determine the sender (always the LC) and the receiver (the person who should get the msg)
  const sender = isReceived ? partner : initiator;
  let receiver = isReceived ? initiator : partner;
  if (!sender || !receiver) return { sender: null, receiver: null };

  // Some custom logic must be processed in mediated payments

  if (isMediated) {
    receiver = mediator;
    if (msgOrder && !failureReason) {
      // In reception cases 5 and 8 are sent to the "target"
      // In sending cases 6 and 7 are sent to the "target"
      // All other cases go to the mediator
      const customReceiverOnOrder = {
        5: isReceived ? initiator : mediator,
        6: isReceived ? mediator : partner,
        7: isReceived ? mediator : partner,
        8: isReceived ? initiator : mediator,
      };
      if (customReceiverOnOrder[msgOrder])
        receiver = customReceiverOnOrder[msgOrder];
    }
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
