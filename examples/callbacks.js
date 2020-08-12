import { Lumino } from "@rsksmart/lumino-light-client-sdk";


// Fired when a payment reception is starting
// Good place to show that a payment has been received and is being processed
Lumino.callbacks.set.setOnReceivedPaymentCallback(payment => {
  showInfo("Received a payment, now processing it...");
});

// A payment was completed
Lumino.callbacks.set.setOnCompletedPaymentCallback(payment => {
  const { amount,c partner: p, isReceived } = payment;
  let message = `Successfully sent ${amount} to ${p}!`;
  // We distignuish between received and sent payments with this prop
  if (isReceived) message = `Successfully received ${amount} from ${p}!`;
  showSuccess(message);
});

// A channel was opened
Lumino.callbacks.set.setOnOpenChannelCallback(channel => {
  const { channel_identifier: id } = channel;
  const message = `Opened new channel ${id}`;
  showSuccess(message);
});

// A deposit on a channel was susccessfull
Lumino.callbacks.set.setOnChannelDepositCallback(channel => {
  const { channel_identifier: id } = channel;
  const message = `New deposit on channel ${id}`;
  showSuccess(message);
});

// An onboarding process has started
Lumino.callbacks.set.setOnRequestClientOnboarding(address => {
  showInfo(`Requested Client onboarding with address ${address}`);
});

// An onboarding process was successfull
Lumino.callbacks.set.setOnClientOnboardingSuccess(address => {
  showSuccess(`Client onboarding with address ${address} was successful!`);
});