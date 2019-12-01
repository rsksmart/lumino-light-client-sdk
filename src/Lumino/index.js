import Store from "../store/index";
import Actions from "../store/actions";
import client from "../apiRest";
import callbacks from "../utils/callbacks";
import { SET_CLIENT_ADDRESS } from "../store/actions/types";

const Lumino = () => {
  let actions;
  let store;
  let luminoFns;
  let luminoConfig = {
    rskEndpoint: "",
    chainId: 0,
    hubEndpoint: "http://localhost:5001/api/v1",
    address: "",
    apiKey: "",
  };

  /**
   * Init Lumino
   * @param {object} luminoHandler - An object that contains a sign property, which is a function to sign TX's onChain and a offChainSign for offChain TX's
   * @param {object} storage -  Object with 2 params, getLuminoData and saveLuminoData, so the lumino state can be persisted through a storage
   */
  const init = async (luminoHandler, storage, configParams) => {
    if (!store) {
      store = await Store.initStore(storage, luminoHandler);
      actions = Store.bindActions(Actions, store.dispatch);
      // Set address
      store.dispatch({
        type: SET_CLIENT_ADDRESS,
        address: configParams.address,
      });
      const changesHook = fn => store.subscribe(fn);
      const luminoInternalState = store.getState();
      const getLuminoInternalState = () => store.getState();
      luminoConfig = { ...luminoConfig, ...configParams };
      client.defaults.baseURL = luminoConfig.hubEndpoint;
      actions = { ...actions };
      luminoFns = {
        actions,
        changesHook,
        getLuminoInternalState,
        luminoInternalState,
      };
    }
    return { ...luminoFns };
  };

  /**
   * Returns the config of the lumino instance
   */
  const getConfig = () => luminoConfig;

  /**
   * Returns the actual lumino instance
   */
  const get = () => {
    if (store) return { ...luminoFns };
    throw new Error("Lumino has not been initialized");
  };

  return { callbacks, init, get, getConfig };
};

const instance = Lumino();

export default instance;
