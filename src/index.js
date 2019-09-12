import Store from './store/index';
import Actions from './store/actions';

let actions = Actions;
let store = null;

const init = (endpoint, luminoHandler, data) => {
  if (!store) {
    store = Store.initStore(data, luminoHandler);
    actions = Store.bindActions(Actions, store.dispatch);
  }
  return {actions};
};

/**
 * Lumino
 * @method
 */
const Lumino = {init};

export default Lumino;
