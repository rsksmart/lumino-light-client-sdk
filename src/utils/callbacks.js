const RECEIVED_PAYMENT = "ReceivedPayment";
const COMPLETED_PAYMENT = "CompletedPayment";
const EXPIRED_PAYMENT = "ExpiredPayment";
const OPEN_CHANNEL = "OpenChannel";
const REQUEST_CLIENT_ONBOARDING = "RequestClientOnboarding";
const CLIENT_ONBOARDING_SUCCESS = "ClientOnboardingSuccess";
const DEPOSIT_CHANNEL = "ChannelDeposit";

export const CALLBACKS = {
  [RECEIVED_PAYMENT]: RECEIVED_PAYMENT,
  [COMPLETED_PAYMENT]: COMPLETED_PAYMENT,
  [EXPIRED_PAYMENT]: EXPIRED_PAYMENT,
  [OPEN_CHANNEL]: OPEN_CHANNEL,
  [REQUEST_CLIENT_ONBOARDING]: REQUEST_CLIENT_ONBOARDING,
  [CLIENT_ONBOARDING_SUCCESS]: CLIENT_ONBOARDING_SUCCESS,
  [DEPOSIT_CHANNEL]: DEPOSIT_CHANNEL,
};

const Callbacks = () => {
  const callbacks = {};

  const set = (CB, FN) => {
    callbacks[CB] = FN;
  };

  const trigger = CB => {
    if (callbacks[CB]) return callbacks[CB]();
    return () => {};
  };

  return { set, trigger };
};

export const callbacks = Callbacks();

export default callbacks;
