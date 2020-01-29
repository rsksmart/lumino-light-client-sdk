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

  /**
   *
   * @param  {...any} args The first argument must be the name of the callback, the second could be data about the callback
   */
  const trigger = (...args) => {
    if (callbacks[args[0]]) return callbacks[args[0]](args[1]);
    return () => {};
  };

  return { set, trigger };
};

export const callbacks = Callbacks();

export default callbacks;
