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
  NEW_DEPOSIT,
  SET_LATEST_INTERNAL_MSG_ID,
  NOTIFICATIONS_POLLING,
  SET_LAST_NOTIFICATION_ID,
  REQUEST_CLIENT_ONBOARDING,
  CLIENT_ONBOARDING_SUCCESS,
  OPEN_CHANNEL_VOTE,
  CLOSE_CHANNEL_VOTE,
} from "../actions/types";
import { saveLuminoData } from "../actions/storage";
import { Lumino } from "../../index";
import { findMaxMsgInternalId } from "../../utils/functions";
import { manageNotificationData } from "../actions/notifier";
import { SDK_CHANNEL_STATUS } from "../../config/channelStates";
import { CALLBACKS } from "../../utils/callbacks";

const getPendingPayments = state => state.payments.pending;

const getPaymentPollingTime = state => state.client.paymentPollingTime;

const getNumberOfNotifiers = state =>
  Object.keys(state.notifier.notifiers).length;

const getChannels = state => state.channelReducer;

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
    const maxIdentifier = findMaxMsgInternalId(data);

    yield put({ type: SET_LATEST_INTERNAL_MSG_ID, id: maxIdentifier });
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

const getChannelKey = channelData => {
  const id = channelData.channel_identifier;
  const tokenAddr = channelData.token_address;
  const key = `${id}-${tokenAddr}`;
  return key;
};

function* checkForOpenChannelInProcessing(data) {
  const {
    channelsBeforeProcessing: channelsBefore,
    channelsAfterProcessing: channelsAfter,
    action,
  } = data;
  const k = getChannelKey(action.channel);
  const channelBefore = channelsBefore[k];
  // Channel did exist
  if (channelBefore) {
    const channelAfter = channelsAfter[k];
    // Did the state change?
    if (!channelAfter) return null;
    if (channelBefore.sdk_status !== channelAfter.sdk_status) {
      // Is now open?
      if (channelAfter.sdk_status === SDK_CHANNEL_STATUS.CHANNEL_OPENED)
        yield Lumino.callbacks.trigger(CALLBACKS.OpenChannel, channelAfter);
    }
  } else {
    // Channel did not exist
  }
}

function checkForCloseChannelInProcessing(data) {
  const {
    channelsBeforeProcessing: channelsBefore,
    channelsAfterProcessing: channelsAfter,
    action,
  } = data;

  const k = getChannelKey(action.channel);
  const channelBefore = channelsBefore[k];
  // Channel did exist
  if (channelBefore) {
    const channelAfter = channelsAfter[k];
    // Did the state change?

    if (!channelAfter) return null;
    if (channelBefore.sdk_status !== channelAfter.sdk_status) {
      // Is now closed?

      if (channelAfter.sdk_status === SDK_CHANNEL_STATUS.CHANNEL_CLOSED)
        Lumino.callbacks.trigger(CALLBACKS.CloseChannel, channelAfter);
    }
  } else {
    // Channel did not exist
  }
}

export function* workNotificationPolling({ data }) {
  let notifications = [];
  if (data && data.fulfilled && data.fulfilled.length)
    notifications = data.fulfilled
      .map(f => ({ info: f.value.data.data, notifier: f.value.config.baseURL }))
      .filter(e => e.info !== null);
  if (notifications.length) {
    const processed = notifications.map(e => manageNotificationData(e));
    const processedFlat = Array.prototype.concat.apply([], processed);

    // We get the number of notifiers now and add it to the action for the reducers.
    const numberOfNotifiers = yield select(getNumberOfNotifiers);

    // A for is used since the yield loses binding on a forEach
    for (let i = 0; i < processedFlat.length; i++) {
      processedFlat[i] = yield processedFlat[i];

      if (processedFlat[i])
        processedFlat[i].action = yield processedFlat[i].action;

      if (processedFlat[i].action) {
        const channelsBefore = yield select(getChannels);
        const channelsBeforeProcessing = { ...channelsBefore };
        // Resolve promise, then dispatch

        if (processedFlat[i].action) {
          yield put({ ...processedFlat[i].action, numberOfNotifiers });
          const channelsAfterProcessing = yield select(getChannels);
          const dataForPostProcess = {
            channelsBeforeProcessing,
            channelsAfterProcessing,
            action: processedFlat[i].action,
          };

          if (processedFlat[i].action.type === OPEN_CHANNEL_VOTE)
            yield checkForOpenChannelInProcessing(dataForPostProcess);
          if (processedFlat[i].action.type === CLOSE_CHANNEL_VOTE) {
            yield checkForCloseChannelInProcessing(dataForPostProcess);
          }
        }
      }
    }

    // We get a map for the latest notification id processed
    const processedIds = {};

    processedFlat.forEach(n => {
      const { notifier, notificationId } = n;
      if (processedIds[notifier]) {
        if (processedIds[notifier] > notificationId)
          return (processedIds[notifier] = notificationId);
      }
      return (processedIds[notifier] = notificationId);
    });

    yield put({ type: SET_LAST_NOTIFICATION_ID, ids: processedIds });
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
  yield put(changeChannelBalance(completed[paymentId]));
  Lumino.callbacks.trigger(CALLBACKS.CompletedPayment, completed[paymentId]);
}

export function* workReceivedPayment({ payment: d }) {
  yield Lumino.callbacks.trigger(CALLBACKS.ReceivedPayment, d);
}

export function* workDepositChannel({ channel }) {
  yield Lumino.callbacks.trigger(CALLBACKS.ChannelDeposit, channel);
}

export function* workRequestClientOnboarding({ address }) {
  yield Lumino.callbacks.trigger(CALLBACKS.RequestClientOnboarding, address);
}

export function* workClientOnboardingSuccess({ address }) {
  yield Lumino.callbacks.trigger(CALLBACKS.ClientOnboardingSuccess, address);
}

export default function* rootSaga() {
  yield takeEvery(MESSAGE_POLLING, workMessagePolling);
  yield takeEvery(CREATE_PAYMENT, workCreatePayment);
  yield takeEvery(SET_PAYMENT_COMPLETE, workPaymentComplete);
  yield takeEvery(RECEIVED_PAYMENT, workReceivedPayment);
  yield takeEvery(NEW_DEPOSIT, workDepositChannel);
  yield takeEvery(NOTIFICATIONS_POLLING, workNotificationPolling);
  yield takeEvery(REQUEST_CLIENT_ONBOARDING, workRequestClientOnboarding);
  yield takeEvery(CLIENT_ONBOARDING_SUCCESS, workClientOnboardingSuccess);
}
