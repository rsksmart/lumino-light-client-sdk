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

export const paymentHasMessageOrder = (paymentId, order) => {
  const payment = getPendingPaymentById(paymentId);
  if (payment) return payment.messages[order];
  return false;
};

export const getPendingPaymentsKeyAndOrder = () => {
  const store = Store.getStore();
  const {
    payments: { pending },
  } = store.getState();
  // TODO: Search for a more efficient or clean way to do this
  const pendingKeys = Object.keys(pending);
  const pendingKeyPair = {};

  pendingKeys.forEach(e => {
    pendingKeyPair[`${e}`] = pending[`${e}`].message_order;
  });
  return pendingKeyPair;
};

export const getChannelsState = () => {
  const store = Store.getStore();
  const { channelStates } = store.getState();
  return channelStates;
};

export const paymentExistsInAnyState = paymentId => {
  const store = Store.getStore();
  const payments = store.getState().paymentIds;
  return payments[paymentId];
};
