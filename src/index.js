import Store from "./store/index";
import Actions from "./store/actions";

let actions = Actions;
let store = null;
let luminoFns = null;

/**
 * Open a channel.
 * @param {string} endpoint - Web3 endpoint
 * @param {object} luminoHandler - An object that contains a sign property, which is a function to sign TX's
 * @param {object} storage -  Object with 2 params, getLuminoData and saveLuminoData, so the lumino state can be persisted through a storage
 */
const init = async (endpoint, luminoHandler, storage) => {
  if (!store) {
    store = await Store.initStore(storage, luminoHandler);
    actions = Store.bindActions(Actions, store.dispatch);
    const changesHook = fn => store.subscribe(fn);
    const luminoInternalState = store.getState();
    const getLuminoInternalState = () => store.getState();
    actions = { ...actions };
    luminoFns = {
      actions,
      changesHook,
      getLuminoInternalState,
      luminoInternalState
    };
  }
  return { ...luminoFns };
};

const get = () => {
  if (luminoFns) return { ...luminoFns };
  throw new Error("Lumino has not been initialized");
};

const Lumino = { init, get };

export default Lumino;
