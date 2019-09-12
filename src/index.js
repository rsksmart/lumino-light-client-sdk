import Store from './store/index';
import Actions from './store/actions';

let actions = Actions;
let store = null;

const init = async (endpoint, luminoHandler, storage) => {
  if (!store) {
    store = await Store.initStore(storage, luminoHandler);
    actions = Store.bindActions(Actions, store.dispatch);
  }
  return {actions};
};

const get = () => {
  if (store) return {actions};
  throw new Error('Lumino has not been initialized');
};

/**
 * Lumino
 * @method
 */
const Lumino = {init, get};

export default Lumino;
