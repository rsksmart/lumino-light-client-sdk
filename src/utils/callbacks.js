const RECEIVED_PAYMENT = "ReceivedPayment";
const COMPLETED_PAYMENT = "CompletedPayment";
const EXPIRED_PAYMENT = "ExpiredPayment";
const OPEN_CHANNEL = "OpenChannel";
const REQUEST_CLIENT_ONBOARDING = "RequestClientOnboarding";
const CLIENT_ONBOARDING_SUCCESS = "ClientOnboardingSuccess";
const CLIENT_ONBOARDING_FAILURE = "ClientOnboardingFailure";
const DEPOSIT_CHANNEL = "ChannelDeposit";
const CLOSE_CHANNEL = "CloseChannel";
const REQUEST_OPEN_CHANNEL = "RequestOpenChannel";
const REQUEST_DEPOSIT_CHANNEL = "RequestDepositChannel";
const REQUEST_CLOSE_CHANNEL = "RequestCloseChannel";
const SENT_PAYMENT = "SentPayment";
const SIGNING_FAIL = "SigningFail";
const FAILED_OPEN_CHANNEL = "FailedOpenChannel";
const FAILED_DEPOSIT_CHANNEL = "FailedDepositChannel";
const DEPOSIT_CHANNEL_VALUE_TOO_LOW = "DepositChannelValueTooLow";
const FAILED_CLOSE_CHANNEL = "FailedCloseChannel";
const FAILED_PAYMENT = "FailedPayment";
const FAILED_CREATE_PAYMENT = "FailedCreatePayment";
const TIMED_OUT_OPEN_CHANNEL = "TimedOutOpenChannel";
const REGISTERED_ON_CHAIN_SECRET = "REGISTERED_ON_CHAIN_SECRET";

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
  FAILED_CREATE_PAYMENT,
  CLIENT_ONBOARDING_FAILURE,
  TIMED_OUT_OPEN_CHANNEL,
  DEPOSIT_CHANNEL_VALUE_TOO_LOW,
  REGISTERED_ON_CHAIN_SECRET,
};

const Callbacks = () => {
  const callbacks = {};

  /**
   *
   * @param {*} CB The constant name of the callback
   * @param  {Function} FN A function that may accept one or many arguments
   */
  const set = (CB, FN) => {
    callbacks[CB] = FN;
  };

  /**
   *
   * @param {*} name The constant name of the callback
   * @param  {...any} args Any number of data to pass to the callback
   */
  const trigger = (name, ...args) => {
    if (callbacks[name]) return callbacks[name](...args);
    return () => {};
  };

  return { set, trigger, names: CALLBACKS };
};

export const callbacks = Callbacks();

export default callbacks;
