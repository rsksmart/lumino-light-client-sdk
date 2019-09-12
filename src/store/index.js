import {createStore, applyMiddleware, bindActionCreators} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {composeWithDevTools} from 'redux-devtools-extension';

import rootReducer from './reducers';

let store = null;

const initStore = (data = {}, luminoHandler) => {
  const lh = {sign: luminoHandler};
  store = createStore(
    rootReducer,
    data,
    composeWithDevTools(applyMiddleware(thunkMiddleware.withExtraArgument(lh))),
  );
  return store;
};

const bindActions = (actions, dispatch) =>
  bindActionCreators(actions, dispatch);

const getStore = () => store;

const Store = {initStore, getStore, bindActions};

export default Store;
