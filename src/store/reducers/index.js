import { combineReducers } from "redux";
import channel from "./channelReducer";
import paymentIds from "./paymentIdsReducer";
import channelStates from "./channelStatesReducer";
import payments from "./paymentsReducer";
import clientReducer from "./clientReducer";
import notifierReducer from "./notifierReducer";
import tokensNetworkReducer from "./tokensNetworkReducer";
import tokenNamesReducer from "./tokenNamesReducer";
import rnsReducer from "./rnsReducer";

const rootReducer = combineReducers({
  channelReducer: channel,
  paymentIds,
  channelStates,
  payments,
  client: clientReducer,
  notifier: notifierReducer,
  tokenNetworks: tokensNetworkReducer,
  tokenNames: tokenNamesReducer,
  rnsReducer: rnsReducer,
});

export default rootReducer;
