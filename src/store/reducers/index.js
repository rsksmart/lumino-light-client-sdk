import { combineReducers } from "redux";
import channel from "./channelReducer";
import paymentIds from "./paymentIdsReducer";
import channelStates from "./channelStatesReducer";
import payments from "./paymentsReducer";
import clientReducer from "./clientReducer";

const rootReducer = combineReducers({
  channelReducer: channel,
  paymentIds,
  channelStates,
  payments,
  client: clientReducer,
});

export default rootReducer;
