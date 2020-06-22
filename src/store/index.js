import { createStore, applyMiddleware, bindActionCreators } from "redux";
import thunkMiddleware from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";
import { createEpicMiddleware } from "redux-observable";
import createSagaMiddleware from "redux-saga";

import rootReducer from "./reducers";
import epics from "./epics";
import rootSaga from "./sagas";
import {
  MESSAGE_POLLING_START,
  START_NOTIFICATIONS_POLLING,
} from "./actions/types";
import client from "../apiRest";

let store = null;
const defaultStore = {
  channelReducer: {},
  paymentIds: {},
  payments: {
    completed: {},
    pending: {},
    failed: {},
  },
};
const defaultStorage = {
  getLuminoData: /* istanbul ignore next */ () => defaultStore,
  saveLuminoData: /* istanbul ignore next */ () => {},
};
let storage = defaultStorage;

const setApiKeyFromStore = (store, configApiKey) => {
  let api_key = configApiKey;
  if (api_key) return (client.defaults.headers = { "x-api-key": api_key });
  // We set the api key of the store if the developer does not provide one
  api_key = store.getState().client.apiKey;
  if (api_key) client.defaults.headers = { "x-api-key": api_key };
};

const initStore = async (storageImpl, luminoHandler, configApiKey) => {
  if (storageImpl) storage = storageImpl;
  const dataFromStorage = await storage.getLuminoData();
  let data = {};
  if (dataFromStorage) data = dataFromStorage;
  const lh = {
    sign: luminoHandler.sign,
    offChainSign: luminoHandler.offChainSign,
    storage,
  };
  const sagaMiddleware = createSagaMiddleware();
  const observableMiddleware = createEpicMiddleware();

  store = createStore(
    rootReducer,
    data,
    composeWithDevTools(
      applyMiddleware(
        thunkMiddleware.withExtraArgument(lh),
        observableMiddleware,
        sagaMiddleware
      )
    )
  );
  setApiKeyFromStore(store, configApiKey);
  observableMiddleware.run(epics);
  sagaMiddleware.run(rootSaga);
  if (client.defaults.headers["x-api-key"])
    store.dispatch({
      type: MESSAGE_POLLING_START,
    });
  const { notifiers } = store.getState().notifier;
  if (Object.keys(notifiers).length)
    store.dispatch({
      type: START_NOTIFICATIONS_POLLING,
    });

  return store;
};

const bindActions = (actions, dispatch) =>
  bindActionCreators(actions, dispatch);

const getStore = () => store;

const destroyStore = () => (store = null);

const stopAllPollings = (actions) => {
  store.dispatch(actions.stopAllPolling());
};

const Store = {
  initStore,
  getStore,
  bindActions,
  destroyStore,
  stopAllPollings,
};

export default Store;
