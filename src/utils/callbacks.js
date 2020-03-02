const Callbacks = () => {
  // TODO: Rewrite this in a more extensible way
  let onReceivedPaymentCallback = () => {};
  let onCompletedPaymentCallback = () => {};

  let onOpenChannel = () => {};
  let onChannelDeposit = () => {};
  let onChannelClose = () => {};

  let onRequestClientOnboarding = () => {};
  let onClientOnboardingSuccess = () => {};

  const setOnReceivedPaymentCallback = fn => (onReceivedPaymentCallback = fn);
  const setOnCompletedPaymentCallback = fn => (onCompletedPaymentCallback = fn);

  const setOnOpenChannelCallback = fn => (onOpenChannel = fn);
  const setOnChannelDepositCallback = fn => (onChannelDeposit = fn);
  const setOnChannelCloseCallback = fn => (onChannelClose = fn);

  const setOnRequestClientOnboarding = fn => (onRequestClientOnboarding = fn);
  const setOnClientOnboardingSuccess = fn => (onClientOnboardingSuccess = fn);

  // Payments trigger

  const triggerOnReceivedPaymentCallback = payment =>
    onReceivedPaymentCallback(payment);

  const triggerOnCompletedPaymentCallback = payment =>
    onCompletedPaymentCallback(payment);

  // Channels trigger

  const triggerOnOpenChannel = channel => onOpenChannel(channel);
  const triggerOnDepositChannel = channel => onChannelDeposit(channel);
  const triggerOnChannelClose = channel => onChannelClose(channel);

  // Onboarding trigger

  const triggerOnRequestClientOnboarding = addr =>
    onRequestClientOnboarding(addr);
  const triggerOnClientOnboardingSuccess = addr =>
    onClientOnboardingSuccess(addr);

  const callbacks = {
    trigger: {
      triggerOnCompletedPaymentCallback,
      triggerOnReceivedPaymentCallback,
      triggerOnOpenChannel,
      triggerOnDepositChannel,
      triggerOnRequestClientOnboarding,
      triggerOnClientOnboardingSuccess,
      triggerOnChannelClose,
    },
    set: {
      setOnCompletedPaymentCallback,
      setOnReceivedPaymentCallback,
      setOnOpenChannelCallback,
      setOnChannelDepositCallback,
      setOnRequestClientOnboarding,
      setOnClientOnboardingSuccess,
      setOnChannelCloseCallback,
    },
  };

  return callbacks;
};

const callbacks = Callbacks();

export default callbacks;
