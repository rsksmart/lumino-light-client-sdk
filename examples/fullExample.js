/**
 * This implementation is not meant to be the only one to be used
 * These codes snippets are just examples on how to use the SDK
 * Always refer to the docs or open issues in case that something may be missing or improperly written
 */

// These examples use 3 notifiers, but you can set up any odd quantity of them 

/**
 * A proper way of ordering this would be
 * 1 - Init the SDK
 * 2 - Prepare the notifiers
 * 3 - Set the callbacks when opening a channel, so we subscribe to the events when the channels closes
 * 4 - Open a channel
 * 5 - Reload the channels on the UI
 * 6 - Make a deposit
 * 7 - Reload the channels on the UI
 * 8 - Make a payment
 * 9 - Close the channel
 */

import {
  Lumino,
  LocalStorageHandler,
  SigningHandler,
} from "@rsksmart/lumino-light-client-sdk";
import Web3 from "web3";
import { CALLBACKS } from "../src/utils/callbacks";

CALLBACKS;

const cbs = Lumino.callbacks.names;

const notifier1 = "http://localhost:8081";
const notifier2 = "http://localhost:8082";
const notifier3 = "http://localhost:8083";

const rskEndpoint = "http://localhost:4444";
const configParams = {
  chainId: 33,
  rskEndpoint,
  hubEndpoint: "http://localhost:5001/api/v1",
  address: "0xb8aaf5caE635943304EF2C1c30127F9F08911D18",
  registryAddress: "0xc8f74D71C18C0b4B8151C5E3d133f5F6037a4084",
};

// This is NOT recommended, the PK should never ever be hardcoded or in the code
// This is done just as an example
const PK = "30d77e732916d6392d90d10966a6dab85541739fc1271fc497e8d03ca6f2d29d";

// Here we init the lumino instance so we can operate with the SDK
// This operation inits the SDK and returns the lumino instance
const initSDK = async () => {
  const web3 = new Web3(rskEndpoint);
  const signingHandler = SigningHandler();
  signingHandler.init(web3, PK);

  const luminoInstance = await Lumino.init(
    signingHandler,
    LocalStorageHandler,
    configParams
  );
  await prepareNotifiers(luminoInstance);
  prepareCallbacks(luminoInstance);
  return luminoInstance;
};

// Example of function to get channels object
// Useful for getting data to update the UI
const refreshChannels = luminoInstance => luminoInstance.actions.getChannels();

// Useful function to init all the initial operations of the notifier
// With this the user will be onboarded to them as well as be aware of channel openings
// Calling it once is enough
const prepareNotifiers = async luminoInstance => {
  // Get api key with notifiers
  await luminoInstance.actions.notifierRegistration(notifier1);
  await luminoInstance.actions.notifierRegistration(notifier2);
  await luminoInstance.actions.notifierRegistration(notifier3);

  // Subscribe to open channel events
  await luminoInstance.actions.subscribeToOpenChannel(notifier1);
  await luminoInstance.actions.subscribeToOpenChannel(notifier2);
  await luminoInstance.actions.subscribeToOpenChannel(notifier3);
};

// Useful to call after a channe has been opened in X token network
// The user will receive info on channels closed in that network by them.
const subscribeToClosingInTokenNetwork = async (
  luminoInstance,
  tokenNetwork
) => {
  // These events are fired when the user closes a channel on X token network
  // The partner closing the channel is other function explained below
  await luminoInstance.actions.subscribeToUserClosesChannelOnToken(
    notifier1,
    tokenNetwork
  );
  await luminoInstance.actions.subscribeToUserClosesChannelOnToken(
    notifier2,
    tokenNetwork
  );
  await luminoInstance.actions.subscribeToUserClosesChannelOnToken(
    notifier3,
    tokenNetwork
  );
};

// In this example we subscribe to the event when a partner closes a channel with us
// This is recommended to be included in the callbacks section when a channel is opened
const subscribeToPartnerClosesChannel = async (
  luminoInstance,
  channelId,
  tokenNetwork
) => {
  await luminoInstance.actions.subscribeToPartnerClosesSpecificChannel(
    notifier1,
    channelId,
    tokenNetwork
  );
  await luminoInstance.actions.subscribeToPartnerClosesSpecificChannel(
    notifier2,
    channelId,
    tokenNetwork
  );

  await luminoInstance.actions.subscribeToPartnerClosesSpecificChannel(
    notifier3,
    channelId,
    tokenNetwork
  );
};

// Create a new payment, this will be handled automatically
// The amount must be in wei
const makeAPayment = (luminoInstance, amount, tokenAddress, partner) => {
  const data = {
    partner,
    tokenAddress,
    amount,
  };
  luminoInstance.actions.createPayment(data);
};

// Open a new channel
const openAChannel = async (
  luminoInstance,
  partner,
  settleTimeout,
  tokenAddress
) => {
  const params = {
    partner,
    settleTimeout,
    tokenAddress,
  };
  await luminoInstance.actions.openChannel(params);
};

// Deposit x amount (in wei) in a channel
const depositOnAChannel = async (
  luminoInstance,
  tokenAddress,
  tokenNetworkAddress,
  amount,
  channelId,
  partner
) => {
  const paramsDeposit = {
    tokenAddress,
    tokenNetworkAddress,
    amount,
    channelId,
    partner,
  };
  await luminoInstance.actions.createDeposit(paramsDeposit);
};

// Close a channel
const closeAChannel = async (
  luminoInstance,
  partner,
  tokenNetworkAddress,
  tokenAddress,
  address,
  channelIdentifier
) => {
  const data = {
    partner,
    tokenAddress,
    address,
    tokenNetworkAddress,
    channelIdentifier,
  };

  await luminoInstance.actions.closeChannel(data);
};

const prepareCallbacks = luminoInstance => {
  // User requested to open a channel
  Lumino.callbacks.set(cbs.REQUEST_OPEN_CHANNEL, channel => {
    // Now it is a good moment to reload the channels and get the temporary channel
    refreshChannels();
    console.log("Channel opening data ", channel);
  });

  // If a channel is opened successfully...
  Lumino.callbacks.set(cbs.OPEN_CHANNEL, async channel => {
    // Now it is a good moment to reload the channels
    refreshChannels();
    console.log("Channel opened data ", channel);

    // The token network is inside the channel
    const { token_network_identifier } = channel;

    // Subscribe to events when channel is closed in the network
    await subscribeToClosingInTokenNetwork(
      luminoInstance,
      token_network_identifier
    );

    // The channel is in the channel_identifier value
    const { channel_identifier } = channel;

    // We want to know if the partner closes the channel as well
    await subscribeToPartnerClosesChannel(
      luminoInstance,
      channel_identifier,
      token_network_identifier
    );
  });

  // When a deposit is successfull...
  Lumino.callbacks.set(cbs.DEPOSIT_CHANNEL, channel => {
    // Now it is a good moment to reload the channels with the new balance
    refreshChannels();
    console.log("Channel deposit success ", channel);
  });

  // When a channel is requested to be closed...
  Lumino.callbacks.set(cbs.REQUEST_CLOSE_CHANNEL, channel => {
    // Now it is a good moment to reload the channels so we can show that it is closing
    refreshChannels();
    console.log("Channel clsoing in process ", channel);
  });

  // If the close is successful
  Lumino.callbacks.set(cbs.CLOSE_CHANNEL, channel => {
    // Now it is a good moment to reload the channels so we can show that it is closed and waiting for settlement
    refreshChannels();
    console.log("Channel clsoing successful ", channel);
  });

  // When a new received payment is starting to being processed...
  Lumino.callbacks.set(cbs.RECEIVED_PAYMENT, payment => {
    console.log("Receiving and processing new payment ", payment);
  });

  // When a payment is sent and the partner is processing it...
  Lumino.callbacks.set(cbs.SENT_PAYMENT, payment => {
    console.log("Sending and processing a payment ", payment);
  });

  // When a payment is completed
  Lumino.callbacks.set(cbs.COMPLETED_PAYMENT, payment => {
    console.log("A payment has been completed ", payment);

    // This value indicates whether we sent it or not
    const { isReceived } = payment;
    console.log(
      isReceived ? "This was a received payment" : "This payment was sent"
    );
  });

  // Oops, a payment failed
  Lumino.callbacks.set(cbs.FAILED_PAYMENT, (payment, error) => {
    console.log("A payment has been failed ", payment);
    console.error(error);
  });
};
