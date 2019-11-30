const Callbacks = () => {
  let onReceivedPaymentCallback = () => {};
  let onCompletedPaymentCallback = () => {};

  const setOnReceivedPaymentCallback = fn => (onReceivedPaymentCallback = fn);
  const setOnCompletedPaymentCallback = fn => (onCompletedPaymentCallback = fn);

  const triggerOnReceivedPaymentCallback = payment =>
    onReceivedPaymentCallback(payment);

  const triggerOnCompletedPaymentCallback = payment =>
    onCompletedPaymentCallback(payment);

  const callbacks = {
    trigger: {
      triggerOnCompletedPaymentCallback,
      triggerOnReceivedPaymentCallback,
    },
    set: {
      setOnCompletedPaymentCallback,
      setOnReceivedPaymentCallback,
    },
  };

  return callbacks;
};

const callbacks = Callbacks();

export default callbacks;
