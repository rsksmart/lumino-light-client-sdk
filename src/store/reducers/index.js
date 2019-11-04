import { combineReducers } from "redux";
import channel from "./channelReducer";
import paymentIds from "./paymentIdsReducer";
import channelStates from "./channelStatesReducer";
import payments from "./paymentsReducer";

const rootReducer = combineReducers({
  channelReducer: channel,
  paymentIds,
  channelStates,
  payments,
});

export default rootReducer;
