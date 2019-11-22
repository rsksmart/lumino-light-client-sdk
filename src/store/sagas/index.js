import { takeEvery, take, select } from "redux-saga/effects";
import { messageManager } from "../../utils/messageManager";
import { MESSAGE_POLLING } from "../actions/types";

const getPendingPayments = state => state.payments.pending;

export function* workMessagePolling() {
  try {
    const { data } = yield take(MESSAGE_POLLING);
    messageManager(data);
    const pending = yield select(getPendingPayments);
    Object.values(pending).forEach(p => {
      if (Object.keys(p.messages).length === 14) return null; // TODO: Mark the payment as completed
    });
  } catch (error) {
    console.log(error);
  }
}

export default function* rootSaga() {
  yield takeEvery(MESSAGE_POLLING, workMessagePolling);
}
