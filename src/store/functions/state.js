import Store from "..";

const getState = () => {
  const store = Store.getStore();
  return store.getState();
};

export default getState;
