# Lumino Light Client SDK

Lumino Light Client (or LC for short) is a Javascript SDK designed specifically to work with React Native and Web environments.

The SDK gives the developer all the functions to work with a Lumino HUB and interact with it, the SDK provides basic implementations and handlers for web environments, but leaving the freedom to the developer to implement them as they see fit.

# Pre-Requisites

- A JSON-RPC capable provider (Web3, Ethers.js)

# Installing

**Yarn**

`yarn install @rsksmart/lumino-light-client-sdk`

**NPM**

`npm install --save @rsksmart/lumino-light-client-sdk`

## Starting

```javascript
import { Lumino } from "@rsksmart/lumino-light-client-sdk";
```

Lumino is our main interface to interact with the SDK.<br/>
This interface returns a singleton instance of the SDK.<br/>
Lumino must be initialized before being used, with the following function

```javascript
Lumino.init(signignHandler, storageHandler, config);
```

## Initialization

```javascript
Lumino.init(signignHandler, storageHandler, config);
```

In order to initialize Lumino, the method accepts the next params

## SigningHandler

This is an object with the next two methods

```javascript
sign(data: Transaction) => signature: String
```

Method that signs an Ethereum transaction (for example a web3 signTransaction)

```javascript
offChainSign(data: Uint8Array) => signature: String
```

Method that signs any kind of message, not just transactions.

**NOTE:** We conducted our tests of the SDK with the ether.js Wallet implementation, which perfectly supports the data, we encourage using ethers.js or other method that is capable of signing the data.

In order to make the setup more easier, we provided a default handler,
in the form of SigningHandler, which can be imported from the sdk

```javascript
import { SigningHandler } from "@rsksmart/lumino-light-client-sdk";

const signingHandler = SigningHandler();

signingHandler.init(web3, PrivateKey);
```

The signingHandler accepts a web3 instance pointing to a provider, and a PrivateKey, this handler can be passed to Lumino and it will work.

**Providing your own handler**

We support custom implementations, as long as an object with both of the prior methods are passed and can perform a correct signature, we encourage new implementations and research on the matter.

## LocalStorageHandler

Lumino in order to work must keep in persistance some data, if not the SDK would lose all of its data after the application is closed.

In order to do so, a storage implementation must be provided, this is an object with 2 methods.

```javascript
getLuminoData() => data: Object
```

This method returns the data that has been stored by the SDK, it could be any implementation (localStorage, AsyncStorage...), it supports async operations.

---

```javascript
saveLuminoData(data: Object) => void
```

This method saves the data that the SDK has stored in memory, implementations can also be of any type, it must accept a parameter (**data**) which is a JS object containing the data of the SDK.

```javascript
import { LocalStorageHandler } from "@rsksmart/lumino-light-client-sdk";
```

We also provide a default implementation of the handler in the SDK, this is for a web enviroment and can be imported from the SDK.

---

**Providing your own handler**

As in the Signing, we also support your own custom implementations, as long as the object of the handler has the required methods.

## ConfigParams

This is an object with the next params

| Name            | Description                 |
| --------------- | --------------------------- |
| chainId         | The chainId to use          |
| rskEndpoint     | An endpoint to a RSK Node   |
| hubEndpoint     | An endpoint to a Lumino HUB |
| address         | The Client address          |
| registryAddress | The RNS registry address    |

## Initializing

With all the aforementioned values, Lumino can be initialized with the params in this order with the next ASYNC method.

```javascript
Lumino.init(signingHandler, localStorageHandler,ConfigParams) => Promise<LuminoInstance>
```

This method returns a singleton, which can be stored for usage.

```javascript
const lumino = await Lumino.init(luminoHandler, storageImplementation);
```

# How it Works

Lumino has a predefined path on how it works and how the users should experience using the technology, these points illustrate how it should go.

1.  Onboard the Client with the Hub in order to interact with it [(Onboarding)](#onboarding)
2.  Register the user with a RIF Notifier, and subscribe to topics [(RIF Notifier)](#onboarding)
3.  Open a channel with a partner to send and receive payments with them [(Open Channel)](#onboarding)
4.  Deposit some tokens to make a payment [(Deposit)](#onboarding)
5.  Make a Payment [(Payments)](#onboarding)
6.  Close the channels to settle all the funds and get new onChain balance from the payments [(Close Channel)](#onboarding)

Most of the payments logic and checks are abstracted and checked inside the SDK, so you can focus on writing code for the UX.

For this we have also a series of Success Callbacks, so when an operation is completed, the developer can provide actual feedback to the user (Callbacks)

# Lumino instance

After Lumino has been initialized, new methods are exposed to be used

```javascript
Lumino.get() => luminoInstance
```

Returns the intialized lumino instance, if lumino was not initialized before it will throw an error

The instance methods are the following

# Lumino internals

```javascript
getLuminoInternalState() => luminoInternalState: Object
```

Retrieves the internal state of SDK and returns it

<br/>

```javascript
luminoInternalState;
```

This is the lumino internal state, it can be accessed directly in order to be inspected or make comparisons.

# Onboarding

Before any kind of operation can be processed, the SDK must be onboarded, for this we abstracted a method in the actions of Lumino

<br/>

```javascript
lumino.actions.onboardingClient() => Promise<void>
```

**Async** method that request to the hub to start the process of onboarding, it resolves and stores an Api Key in the SDK data.

<br/>

```javascript
Lumino.actions.getApiKey() => apiKey: String
```

Method that returns the Apikey stored by the onboarding process, or an empty string if no onboarding was performed.

<br/>

```javascript
Lumino.actions.setApiKey(apiKey: String) => void
```

This method forces a new api key on the SDK, it will set it and then store it, it is not recommended to use it without caution

# Actions

Lumino has actions for many operations, all of them are usually under .actions, here we explain some of them, their use, parameters and return values.

<br/>

```javascript
getChannels() => channels: Object
```

Returns a list of all lumino channels held in the internal state, regardless of their state.
The channels are identified by their channel identifier number and the token address where they were opened.

# On Chain Operations

The next functions are considered **ON CHAIN** operations and will have a cost of RBTC, all of them are async functions and will take time depending on the type of Network (Regtest,Testnet,Mainnet).

```javascript
openChannel(requestBody: Object) => Promise<void>
```

### Request Body values

| Name            | Type              | Required | Description                                            |
| --------------- | ----------------- | -------- | ------------------------------------------------------ |
| partner_address | String            | ✔️       | Partner to open the channel with                       |
| token_address   | String            | ✔️       | The token address in which the channell will be opened |
| settleTimeout   | Number            |          | Blocks for timeout to settle the channel               |
| gasPrice        | Number `|` String |          | The gas price to use in the transaction                |
| gasLimit        | Number `|` String |          | The gas limit to use in the transaction                |

---

```javascript
createDeposit(requestBody: Object) => Promise<void>
```

Deposits balance in a channel, the request body is the next:

```javascript
const requestBody = {
  partner_address: "0x123...",
  total_deposit: Number,
  channelId: Number,
  token_address: "0x987...",
};
```

The amount of the deposit should be expressed in wei.

Optional params

| Name             | Description                                      |
| ---------------- | ------------------------------------------------ |
| gasPrice         | The gas price to use in the transaction          |
| gasLimitApproval | The gas limit to use in the approval transaction |
| gasLimitDeposit  | The gas limit to use in the deposit transaction  |

---

```javascript
await closeChannel(requestBody: Object) => void
```

Requests the close of a channel that is opened, the requestBody is the next:

```javascript
const requestBody = {
	partner_address: "0x123...",
	channel_identifier: Number
	token_address: "0x987..."
};
```

Optional params

| Name     | Description                             |
| -------- | --------------------------------------- |
| gasPrice | The gas price to use in the transaction |
| gasLimit | The gas limit to use in the transaction |

---

## Payments

This is the core of the SDK, the ability to make offChain payments that are fast and easy for low fees.
Due to the offchain nature of this opreation, it will not take as much time as the other ones.
In order to invoke the method and allow the SDK to process a payment the next method is used:

```javascript
await createPayment(requestBody: Object) => void
```

This create a payment in a channel with balance, wheter it was from a deposit or from received payments, the body is the next:

```javascript
const requestBody = {
  partner: partner_address: "0x123...",
  amount: 1000000000000,
  token_address: "0x987...",
};
```

The amount should be in wei, and should be equal or less than the balance of the channel, if a payment is requested with insufficent funds, the SDK will log an error and interrupt the process.

## Callbacks

Lumino provides a simple interfaces for callbacks, which are the ones that we trigger on certain actions and pass data regarding the action.
Thanks to this the developer can provide actual feedback to its users.

Callbacks are set on the **Lumino** instance like this:

```javascript
Lumino.callbacks.set.setNameOfCallback;
```

The callbacks.set method sets a function that may or may not receive the data regarding the event, the next table illustrates the callbacks, when they are fired and the data they provide (Which is always a single object or nothing)

| Name                          | Fired when                                         | Data (Object)                         |
| ----------------------------- | -------------------------------------------------- | ------------------------------------- |
| setOnCompletedPaymentCallback | Received or sent payment is successfully completed | The payment data                      |
| setOnReceivedPaymentCallback  | Payment is received                                | The payment data                      |
| setOnOpenChannelCallback      | Channel is Opened by the client or a partner       | The channel data                      |
| setOnChannelDepositCallback   | channel deposit is successful                      | The channel data                      |
| setOnRequestClientOnboarding  | Onboarding process is initiated                    | Address that requested the onboarding |
| setOnClientOnboardingSuccess  | Onboarding process is successful                   | Address that requested the onboarding |

Examples

```javascript
// Inform that we receive a payment
Lumino.callbacks.set.setOnReceivedPaymentCallback(payment => {
  showInfo("Received a payment, now processing it...");
});

// A payment was completed
Lumino.callbacks.set.setOnCompletedPaymentCallback(payment => {
  const { amount, partner: p, isReceived } = payment;
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
```

The functions can be of any kind, in these examples we just used a toast to show the info, but the developer is free to use whatever they want

## Notifier

The Light client is not aware of everything that happens outside of the action it performs.
For example, when a partner opens a channel, it is not made aware of that event, the same as when a channel is closed by a partner.

To tackle this problem, the Lumino ecosystem has a Notifier, which objective is to provide the information about events regarding what operations happen on the blockchain.

Those events are filtered by topics, which are abstracted by the SDK so the developer doesn't have to write logic for managing them.

## How to use it

The notifier is abstracted in simple methods that just need to be summoned, they accept no params since they just use the data from the config of the SDK

These methods live under the actions and are all async

**Registering with the notifier**

```javascript
notifierRegistration() => void
```

Registers the LC in the notifier that was passed in the config of `Lumino.init` it must be executed **only once per SDK configuration**, since the data of the registration is stored.

Example

```javascript
await lumino.actions.notifierRegistration();
```

---

**Listening to Open Channel events**

```javascript
subscribeToOpenChannel() => void
```

This method subscribes the Light client to all the events of open channel where a partner creates a channel with them.

The SDK will take care of creating the channel and will execute the OpenChannel callback on success.

## Notifier on the background

In order to receive events, this iteration of the SDK and notifier work in a polling model, every one second the notifier is asked for events, in case that a new one has been detected, the SDK will act accordingly to them.

After processing an event, it will not be fetched again since the SDK will ask for events after the last one processed, so no overfetching is performed.

## Reproduce build

Run:

```
npm run build
```
