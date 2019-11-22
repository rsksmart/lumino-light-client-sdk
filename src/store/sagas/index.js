import { takeEvery, select, put, all } from "redux-saga/effects";
import { messageManager } from "../../utils/messageManager";
import { MESSAGE_POLLING, SET_PAYMENT_COMPLETE } from "../actions/types";
import { saveLuminoData } from "../actions/storage";

const getPendingPayments = state => state.payments.pending;

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
    yield put(saveLuminoData());
  } catch (error) {
    console.error(error);
  }
}

export default function* rootSaga() {
  yield takeEvery(MESSAGE_POLLING, workMessagePolling);
}
