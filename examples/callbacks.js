import { Lumino } from "@rsksmart/lumino-light-client-sdk";

/*
These code snippets are just some examples of the callbacks of the SDK
These are not all the methods, but some examples on how to provide callbacks
*/

const cbs = { ...Lumino.callbacks.names };

// Fired when a payment reception is starting
// Good place to show that a payment has been received and is being processed
Lumino.callbacks.set(cbs.RECEIVED_PAYMENT, payment => {
  console.log("Processing incoming payment ", payment);
});

// A payment was completed
Lumino.callbacks.set(cbs.COMPLETED_PAYMENT, payment => {
  const { amount, partner, isReceived } = payment;
  console.log(amount, partner, isReceived);
});

// A channel was opened
Lumino.callbacks.set(cbs.OPEN_CHANNEL, channel => {
  const { channel_identifier } = channel;
  console.log("New channel with id: ", channel_identifier);
});

// An onboarding process has started
Lumino.callbacks.set(cbs.REQUEST_CLIENT_ONBOARDING, address => {
  console.log("Requested onboarding with address: ", address);
});

// A deposit failed
Lumino.callbacks.set(cbs.FAILED_DEPOSIT_CHANNEL, (channel, error) => {
  console.log("Depositing on the channel has failed ", channel);
  console.error("Reason: ", error );
});
