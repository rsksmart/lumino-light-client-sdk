import Store from "./store/index";
import Actions from "./store/actions";

const Lumino = () => {
  let actions;
  let store;
  let luminoFns;

  /**
   * Init Lumino
   * @param {object} luminoHandler - An object that contains a sign property, which is a function to sign TX's onChain and a offChainSign for offChain TX's
   * @param {object} storage -  Object with 2 params, getLuminoData and saveLuminoData, so the lumino state can be persisted through a storage
   */
  const init = async (luminoHandler, storage) => {
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
        luminoInternalState,
      };
    }
    return { ...luminoFns };
  };

  /**
   * Returns the actual lumino instance
   */
  const get = () => {
    if (store) return { ...luminoFns };
    throw new Error("Lumino has not been initialized");
  };

  return { init, get };
};

const luminoInstance = Lumino();

export default luminoInstance;