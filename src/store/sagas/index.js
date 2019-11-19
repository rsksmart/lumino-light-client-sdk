import { takeEvery, take } from "redux-saga/effects";
import { messageManager } from "../../utils/messageManager";
import { MESSAGE_POLLING } from "../actions/types";

export function* workMessagePolling() {
  try {
    const { data } = yield take(MESSAGE_POLLING);
    messageManager(data);
  } catch (error) {
    console.log(error);
  }
}

export default function* rootSaga() {
  yield takeEvery(MESSAGE_POLLING, workMessagePolling);
}
