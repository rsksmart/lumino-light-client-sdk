import Store from "..";

export const getState = () => {
  const store = Store.getStore();
  return store.getState();
};
