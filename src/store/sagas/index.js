import { takeEvery, select, put, all } from "redux-saga/effects";
import { messageManager } from "../../utils/messageManager";
import {
  MESSAGE_POLLING,
  SET_PAYMENT_COMPLETE,
  CHANGE_PAYMENT_POLLING_TIME,
  MESSAGE_POLLING_STOP,
  MESSAGE_POLLING_START,
  CREATE_PAYMENT,
  CHANGE_CHANNEL_BALANCE,
  RECEIVED_PAYMENT,
  OPEN_CHANNEL,
  NEW_DEPOSIT,
} from "../actions/types";
import { saveLuminoData } from "../actions/storage";
import { Lumino } from "../../index";

const getPendingPayments = state => state.payments.pending;

const getPaymentPollingTime = state => state.client.paymentPollingTime;

const stopPaymentPolling = () => ({ type: MESSAGE_POLLING_STOP });

const startPaymentPolling = () => ({ type: MESSAGE_POLLING_START });

const getCompletedPaymentById = state => state.payments.completed;

const setPaymentPollingTimerTo = time => ({
  type: CHANGE_PAYMENT_POLLING_TIME,
  time,
});

const changeChannelBalance = payment => ({
  type: CHANGE_CHANNEL_BALANCE,
  payment,
});

function* restartPolling() {
  yield put(stopPaymentPolling());
  yield put(startPaymentPolling());
}

function* setCompleted(paymentId) {
  return yield put({ type: SET_PAYMENT_COMPLETE, paymentId });
}

export function* workMessagePolling({ data }) {
  try {
    messageManager(data);
    const pending = yield select(getPendingPayments);
    const completed = [];
    Object.values(pending).forEach(p => {
      if (Object.keys(p.messages).length === 14) completed.push(p.paymentId);
    });
    yield all(completed.map(paymentId => setCompleted(paymentId)));
    // const pendingAfterCompletion = yield select(getPendingPayments);
    // const actualPaymentPollingTime = yield select(getPaymentPollingTime);
    // if (!Object.keys(pendingAfterCompletion).length) {
    //   if (actualPaymentPollingTime !== 10000) {
    //     yield put(setPaymentPollingTimerTo(10000));
    //     yield restartPolling();
    //   }
    // } else {
    //   if (actualPaymentPollingTime !== 2000) {
    //     yield put(setPaymentPollingTimerTo(2000));
    //     yield restartPolling();
    //   }
    // }
    yield put(saveLuminoData());
  } catch (error) {
    console.error(error);
  }
}

export function* workCreatePayment() {
  // const actualPaymentPollingTime = yield select(getPaymentPollingTime);
  // if (actualPaymentPollingTime !== 2000) {
  //   yield put(setPaymentPollingTimerTo(2000));
  //   yield restartPolling();
  // }
}

export function* workPaymentComplete({ paymentId }) {
  const completed = yield select(getCompletedPaymentById);
  Lumino.callbacks.trigger.triggerOnCompletedPaymentCallback(paymentId);
  yield put(changeChannelBalance(completed[paymentId]));
}

export function* workReceivedPayment({ payment: d }) {
  Lumino.callbacks.trigger.triggerOnReceivedPaymentCallback(d.payment);
}

export function* workOpenChannel({ channel }) {
  Lumino.callbacks.trigger.triggerOnOpenChannel(channel);
}

export function* workDepositChannel({ channel }) {
  Lumino.callbacks.trigger.triggerOnDepositChannel(channel);
}

export default function* rootSaga() {
  yield takeEvery(MESSAGE_POLLING, workMessagePolling);
  yield takeEvery(CREATE_PAYMENT, workCreatePayment);
  yield takeEvery(SET_PAYMENT_COMPLETE, workPaymentComplete);
  yield takeEvery(RECEIVED_PAYMENT, workReceivedPayment);
  yield takeEvery(OPEN_CHANNEL, workOpenChannel);
  yield takeEvery(NEW_DEPOSIT, workDepositChannel);
}
