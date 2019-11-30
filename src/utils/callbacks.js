const Callbacks = () => {
  let onReceivedPaymentCallback = () => {};
  let onCompletedPaymentCallback = () => {};

  let onOpenChannel = () => {};
  let onChannelDeposit = () => {};

  const setOnReceivedPaymentCallback = fn => (onReceivedPaymentCallback = fn);
  const setOnCompletedPaymentCallback = fn => (onCompletedPaymentCallback = fn);

  const setOnOpenChannelCallback = fn => (onOpenChannel = fn);
  const setOnChannelDepositCallback = fn => (onChannelDeposit = fn);

  // Payments trigger

  const triggerOnReceivedPaymentCallback = payment =>
    onReceivedPaymentCallback(payment);

  const triggerOnCompletedPaymentCallback = payment =>
    onCompletedPaymentCallback(payment);

  // Channels trigger

  const triggerOnOpenChannel = channel => onOpenChannel(channel);
  const triggerOnDepositChannel = channel => onChannelDeposit(channel);

  const callbacks = {
    trigger: {
      triggerOnCompletedPaymentCallback,
      triggerOnReceivedPaymentCallback,
      triggerOnOpenChannel,
      triggerOnDepositChannel,
    },
    set: {
      setOnCompletedPaymentCallback,
      setOnReceivedPaymentCallback,
      setOnOpenChannelCallback,
      setOnChannelDepositCallback,
    },
  };

  return callbacks;
};

const callbacks = Callbacks();

export default callbacks;
