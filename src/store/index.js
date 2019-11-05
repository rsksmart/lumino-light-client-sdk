import { createStore, applyMiddleware, bindActionCreators } from "redux";
import thunkMiddleware from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";
import { createEpicMiddleware } from 'redux-observable';

import rootReducer from "./reducers";
import paymentsMonitoredEpic from './epics';

let store = null;
const defaultStore = { channelReducer: [] };
const defaultStorage = {
  getLuminoData: () => defaultStore,
  saveLuminoData: () => {},
};
let storage = defaultStorage;

const observableMiddleware = createEpicMiddleware();

const initStore = async (storageImpl, luminoHandler) => {
  if (storageImpl) storage = storageImpl;
  const dataFromStorage = await storage.getLuminoData();
  let data = {};
  if (dataFromStorage) {
    data = dataFromStorage;
  }
  const lh = {
    sign: luminoHandler.sign,
    offChainSign: luminoHandler.offChainSign,
    storage,
  };
  store = createStore(
    rootReducer,
    data,
    composeWithDevTools(applyMiddleware(thunkMiddleware.withExtraArgument(lh), observableMiddleware))
  );
  return store;
};

const bindActions = (actions, dispatch) =>
  bindActionCreators(actions, dispatch);

const getStore = () => store;

const Store = { initStore, getStore, bindActions };

observableMiddleware.run(paymentsMonitoredEpic);

export default Store;
