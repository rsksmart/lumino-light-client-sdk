import Store from "../index";

export const getPaymentIds = () => {
  const store = Store.getStore();
  const { paymentIds } = store.getState();
  return paymentIds;
};

export const getPendingPaymentById = paymentId => {
  const store = Store.getStore();
  const { payments } = store.getState();
  return payments.pending[paymentId];
};

export const getChannelsState = () => {
  const store = Store.getStore();
  const { channelStates } = store.getState();
  return channelStates;
};
