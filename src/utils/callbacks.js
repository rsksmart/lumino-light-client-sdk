export const RECEIVED_PAYMENT = "ReceivedPayment";
export const COMPLETED_PAYMENT = "CompletedPayment";
export const EXPIRED_PAYMENT = "ExpiredPayment";

export const CALLBACKS = {
  [RECEIVED_PAYMENT]: RECEIVED_PAYMENT,
  [COMPLETED_PAYMENT]: COMPLETED_PAYMENT,
};

export const newCallbacks = () => {
  const callbacks = {};

  const set = (CB, FN) => {
    callbacks[CB] = FN;
  };

  const trigger = CB => {
    if (callbacks[CB]) return callbacks[CB]();
    return console.error("Callback was not set");
  };

  return { set, trigger };
};

export const newCbs = newCallbacks();

const Callbacks = () => {
  // TODO: Rewrite this in a more extensible way
  let onReceivedPaymentCallback = () => {};
  let onCompletedPaymentCallback = () => {};

  let onOpenChannel = () => {};
  let onChannelDeposit = () => {};

  let onRequestClientOnboarding = () => {};
  let onClientOnboardingSuccess = () => {};

  const setOnReceivedPaymentCallback = fn => (onReceivedPaymentCallback = fn);
  const setOnCompletedPaymentCallback = fn => (onCompletedPaymentCallback = fn);

  const setOnOpenChannelCallback = fn => (onOpenChannel = fn);
  const setOnChannelDepositCallback = fn => (onChannelDeposit = fn);

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
    },
    set: {
      setOnCompletedPaymentCallback,
      setOnReceivedPaymentCallback,
      setOnOpenChannelCallback,
      setOnChannelDepositCallback,
      setOnRequestClientOnboarding,
      setOnClientOnboardingSuccess,
    },
  };

  return callbacks;
};

const callbacks = Callbacks();

export default callbacks;
