import Store from './store/index';
import Actions from './store/actions';

let actions = Actions;
let store = null;
let luminoFns = null;

const init = async (endpoint, luminoHandler, storage) => {
  if (!store) {
    store = await Store.initStore(storage, luminoHandler);
    actions = Store.bindActions(Actions, store.dispatch);
    const changesHook = fn => store.subscribe(fn);
    const luminoInternalState = store.getState();
    const getLuminoInternalState = () => store.getState();
    actions = {...actions};
    luminoFns = {
      actions,
      changesHook,
      getLuminoInternalState,
      luminoInternalState,
    };
  }
  return {...luminoFns};
};

const get = () => {
  if (store) return {...luminoFns};
  throw new Error('Lumino has not been initialized');
};

/**
 * Lumino
 * @method
 */
const Lumino = {init, get};

export default Lumino;
