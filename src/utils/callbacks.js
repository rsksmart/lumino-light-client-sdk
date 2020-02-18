const RECEIVED_PAYMENT = "ReceivedPayment";
const COMPLETED_PAYMENT = "CompletedPayment";
const EXPIRED_PAYMENT = "ExpiredPayment";
const OPEN_CHANNEL = "OpenChannel";
const REQUEST_CLIENT_ONBOARDING = "RequestClientOnboarding";
const CLIENT_ONBOARDING_SUCCESS = "ClientOnboardingSuccess";
const DEPOSIT_CHANNEL = "ChannelDeposit";
const CLOSE_CHANNEL = "CloseChannel";
const REQUEST_OPEN_CHANNEL = "RequestOpenChannel";
const REQUEST_DEPOSIT_CHANNEL = "RequestDepositChannel";
const REQUEST_CLOSE_CHANNEL = "RequestCloseChannel";
const SENT_PAYMENT = "SentPayment";
const SIGNING_FAIL = "SigningFail";
const FAILED_OPEN_CHANNEL = "FailedOpenChannel";
const FAILED_DEPOSIT_CHANNEL = "FailedDepositChannel";
const FAILED_CLOSE_CHANNEL = "FailedCloseChannel";
const FAILED_PAYMENT = "FailedPayment";

export const CALLBACKS = {
  RECEIVED_PAYMENT,
  COMPLETED_PAYMENT,
  EXPIRED_PAYMENT,
  OPEN_CHANNEL,
  REQUEST_CLIENT_ONBOARDING,
  CLIENT_ONBOARDING_SUCCESS,
  DEPOSIT_CHANNEL,
  CLOSE_CHANNEL,
  REQUEST_OPEN_CHANNEL,
  REQUEST_DEPOSIT_CHANNEL,
  REQUEST_CLOSE_CHANNEL,
  SENT_PAYMENT,
  SIGNING_FAIL,
  FAILED_OPEN_CHANNEL,
  FAILED_DEPOSIT_CHANNEL,
  FAILED_CLOSE_CHANNEL,
  FAILED_PAYMENT,
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
