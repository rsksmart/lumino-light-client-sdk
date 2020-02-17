import Store from "..";

export const getNumberOfNotifiers = () => {
  const store = Store.getStore();
  const { notifiers } = store.getState().notifier;
  return Object.keys(notifiers);
};
