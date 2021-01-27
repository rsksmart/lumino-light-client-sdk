# Lumino Light Client SDK

Lumino Light Client (or LC for short) is a Javascript SDK designed specifically to work with React Native and Web environments.

The SDK gives the developer all the functions to work with a Lumino HUB and interact with it, the SDK provides basic implementations and handlers for web environments, but leaving the freedom to the developer to implement them as they see fit.

# Pre-Requisites

- A JSON-RPC capable provider (Web3, Ethers.js)

# Installing

**Yarn**

`yarn add @rsksmart/lumino-light-client-sdk`

**NPM**

`npm install --save @rsksmart/lumino-light-client-sdk`

<br/>

# Examples

Some examples on how to integrate and use the SDK are available [here](examples/fullExample.js)

</br>The documentation is worthwile reading though and we encourage you to use the examples as a guideline
</br>

## Initialization

```javascript
import { Lumino } from "@rsksmart/lumino-light-client-sdk";

Lumino.init(signignHandler, storageHandler, config);
```

Lumino is our main interface to interact with the SDK.<br/>
This interface returns a singleton instance of the SDK.<br/>
In order to initialize Lumino, the method accepts the next params

<br/>

## SigningHandler

This is an object with the next two methods

```javascript
sign(data: Transaction) => signature: String
```

Method that signs an Ethereum transaction (for example a web3 signTransaction)

<br/>

```javascript
offChainSign(data: Uint8Array) => signature: String
```

Method that signs any kind of message, not just transactions.

**NOTE:** We conducted our tests of the SDK with the ether.js Wallet implementation, which perfectly supports the data, we encourage using ethers.js or other method that is capable of signing the data.

In order to make the setup more easier, we provided a default handler,
in the form of SigningHandler, which can be imported from the sdk

<br/>

```javascript
import { SigningHandler } from "@rsksmart/lumino-light-client-sdk";

const signingHandler = SigningHandler();

signingHandler.init(web3, PrivateKey);
```

The signingHandler accepts a web3 instance pointing to a provider, and a PrivateKey, this handler can be passed to Lumino and it will work.

**Providing your own handler**

We support custom implementations, as long as an object with both of the prior methods are passed and can perform a correct signature, we encourage new implementations and research on the matter.

<br/>

## LocalStorageHandler

Lumino in order to work must keep in persistance some data, if not the SDK would lose all of its data after the application is closed.

In order to do so, a storage implementation must be provided, this is an object with 2 methods.

```javascript
getLuminoData() => data: Object
```

This method returns the data that has been stored by the SDK, it could be any implementation (localStorage, AsyncStorage...), it supports async operations.

<br/>

```javascript
saveLuminoData(data: Object) => void
```

This method saves the data that the SDK has stored in memory, implementations can also be of any type, it must accept a parameter (**data**) which is a JS object containing the data of the SDK.

<br/>

```javascript
import { LocalStorageHandler } from "@rsksmart/lumino-light-client-sdk";
```

We also provide a default implementation of the handler in the SDK, this is for a web enviroment and can be imported from the SDK.

**Providing your own handler**

As in the Signing, we also support your own custom implementations, as long as the object of the handler has the required methods.

<br/>

## ConfigParams

This is an object with the next params

| Name            | Description                 |
| --------------- | --------------------------- |
| chainId         | The chainId to use          |
| rskEndpoint     | An endpoint to a RSK Node   |
| hubEndpoint     | An endpoint to a Lumino HUB |
| address         | The Client address          |
| registryAddress | The RNS registry address    |

<br/>

## Getting access to an instance

With all the aforementioned values, Lumino can be initialized with the params in this order with the next ASYNC method.

```javascript
Lumino.init(signingHandler, localStorageHandler,ConfigParams) => Promise<LuminoInstance>
```

This method returns a singleton instance of lumino, which can be used to access all lumino features and functions

<br />

# How to use

Lumino has a predefined path on how it works and how the users should experience using the technology, these points illustrate how it should go.

1.  Onboard the Client with the Hub in order to interact with it [(Onboarding)](#onboarding)
    - Learn about callbacks in the SDK [(Callbacks)](#Callbacks)
2.  Register the user with a RIF Notifier, and subscribe to topics [(RIF Notifier)](#onboarding)
3.  Open a channel with a partner to send and receive payments with them [(Open Channel)](<#Open Channel>)
4.  Deposit some tokens to make a payment [(Deposit)](#deposit)
5.  Make a Payment [(Payments)](#payments)
6.  Close the channels to settle all the funds and get new onChain balance from the payments [(Close Channel)](<#Close Channel>)

Most of the payments logic and checks are abstracted and checked inside the SDK, so you can focus on writing code for the UX.

<br/>

# Lumino instance

After Lumino has been initialized, new methods are exposed to be used

```javascript
Lumino.get() => LuminoInstance
```

Returns the intialized lumino instance, if lumino was not initialized before it will throw an error

</br>

```javascript
Lumino.destroy() => void
```

Destroys the singleton isntance of Lumino and stops all polling, recommended to use when SDK won't be needed anymore

</br>

```javascript
Lumino.reConfigure(signignHandler, storageHandler, config) => Promise<LuminoInstance>
```

This method will destroy the current isntance and reinitialize it with the provided new values, the details are the same from [initialization](#initialization)

<br/>

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

<br/>

# Actions

Lumino has actions for many operations, all of them are usually under .actions, here we explain some of them, their use, parameters and return values.

```javascript
getChannels() => channels: Object
```

Returns a list of all lumino channels held in the internal state, regardless of their state.
<br/>

The channels are identified by their channel identifier number and the token address where they were opened.

<br/>

# On Chain Operations

The next functions are considered **ON CHAIN** operations and will have a cost of RBTC, all of them are async functions and will take time depending on the type of Network (Regtest,Testnet,Mainnet).

## Open Channel

Requests to open a channel with a partner in a given token address

```javascript
openChannel(requestBody: Object) => Promise<void>
```

### Caveats

- When opening a channel, the original request must be awaited for, if the request is lost, the channel will no te be opened
- After the REQUEST_OPEN_CHANNEL has been fired, a temporary channel is created, that temporary channel is not meant to be used for operations, only for showing an intermediate state
  <br/>

### Request Body values

|      Name       |   Type   | Required | Description                                            |
| :-------------: | :------: | :------: | ------------------------------------------------------ |
| partner_address | `String` |    ✔️    | Partner to open the channel with                       |
|  token_address  | `String` |    ✔️    | The token address in which the channell will be opened |
|  settleTimeout  | `Number` |          | Blocks for timeout to settle the channel               |
|    gasPrice     | `String` |          | The gas price to use in the transaction                |
|    gasLimit     | `String` |          | The gas limit to use in the transaction                |

---

<br/>

## Deposit

Requests to deposit a certain amount of tokens in an opened channel

```javascript
createDeposit(requestBody: Object) => Promise<void>
```

### Caveats

- When depositing a channel, the original request must be awaited for, if the request is lost, the deposit may succeed, but the SDK will not update the balance
  <br/>

### Request Body values

|       Name       |   Type   | Required | Description                                      |
| :--------------: | :------: | :------: | ------------------------------------------------ |
| partner_address  | `String` |    ✔️    | Partner of the channel                           |
|  token_address   | `String` |    ✔️    | The token address of the channel                 |
|  total_deposit   | `String` |    ✔️    | The deposit to add (in wei)                      |
|    channelId     | `Number` |    ✔️    | The id of the channel                            |
|     gasPrice     | `String` |          | The gas price to use in the transaction          |
| gasLimitApproval | `String` |          | The gas limit to use in the approval transaction |
| gasLimitDeposit  | `String` |          | The gas limit to use in the deposit transaction  |

<br/>

## Close Channel

Requests the closing of a channel that is in an opened state

```javascript
closeChannel(requestBody: Object) => Promise<void>
```

<br/>

### Request Body values

|      Name       |   Type   | Required | Description                             |
| :-------------: | :------: | :------: | --------------------------------------- |
| partner_address | `String` |    ✔️    | Partner of the channel                  |
|  token_address  | `String` |    ✔️    | The token address of the channel        |
|    channelId    | `Number` |    ✔️    | The id of the channel                   |
|    gasPrice     | `String` |          | The gas price to use in the transaction |
|    gasLimit     | `String` |          | The gas limit to use in the transaction |

<br/>

# Payments

The most important part of the SDK, fast payments with low fees.
Due to the offchain nature of this operation, it will not take as much time as the other ones.

```javascript
createPayment(requestBody: Object) => Promise<void>
```

<br/>

### Request Body values

|     Name      |   Type   | Required | Description                                        |
| :-----------: | :------: | :------: | -------------------------------------------------- |
|    partner    | `String` |    ✔️    | Partner that we want to send the payment to        |
| token_address | `String` |    ✔️    | The token address of the token that we want to pay |
|    amount     | `String` |    ✔️    | The amount of tokens (in wei)                      |

<br/>

# Callbacks

When an event is processed, a failure in an operation is detected, the SDK will trigger certain callbacks.
</br>

It is up to the developer to take action or not, in the next table, the callbacks of the SDK are displayed.

</br>

## Request and success callbacks

</br>

| Constant name             | Activated when                                           | Passed Params                             |
| ------------------------- | -------------------------------------------------------- | ----------------------------------------- |
| REQUEST_OPEN_CHANNEL      | The SDK requested the HUB to open a channel              | Data about the channel                    |
| REQUEST_DEPOSIT_CHANNEL   | The SDK requested the HUB to make a deposit in a channel | Data about the channel                    |
| REQUEST_CLOSE_CHANNEL     | The SDK requested the HUB to close a channel             | Data about the channel                    |
| REQUEST_CLIENT_ONBOARDING | The SDK requested an onboarding to a HUB                 | The address that requested the onboarding |
| CLIENT_ONBOARDING_SUCCESS | The HUB onboarding was successful                        | The address that requested the onboarding |
| OPEN_CHANNEL              | A channel has successfuly opened                         | The channel                               |
| DEPOSIT_CHANNEL           | A deposit in a channel was successful                    | The channel                               |
| CLOSE_CHANNEL             | A channel was closed successfuly                         | The channel                               |
| RECEIVED_PAYMENT          | A payment is received and will be processed              | The payment                               |
| COMPLETED_PAYMENT         | A received or sent payment has completed processing      | The payment                               |
| SENT_PAYMENT              | A created payment started its process successfuly        | The payment                               |

</br>

To set a callback the process is very easy:

```javascript
const callbackConst = Lumino.callbacks.names.CALLBACKS.REQUEST_OPEN_CHANNEL;
Lumino.callbacks.set(callbackConst, data => {
  /* do something...*/
});
```

</br>
The constants are under the name key in the callback section.

## Failure callbacks

</br>

| Constant name             | Activated when                                              | Passed Params                             |
| ------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| EXPIRED_PAYMENT           | A received or sent payment has expired                      | The payment                               |
| SIGNING_FAIL              | Signing a message or transaction failed                     | The error \*                              |
| FAILED_OPEN_CHANNEL       | Trying to open a channel resulted in a failure              | Data about the channel                    |
| FAILED_DEPOSIT_CHANNEL    | Trying to make a deposit in a channel resulted in a failure | Data about the channel                    |
| FAILED_CLOSE_CHANNEL      | Trying to close a channel resulted in a failure             | Data about the channel                    |
| FAILED_PAYMENT            | A payment failed during its processing                      | The payment                               |
| FAILED_CREATE_PAYMENT     | A payment could not be created                              | Data about the payment                    |
| CLIENT_ONBOARDING_FAILURE | The onboarding process has failed                           | The address that requested the onboarding |
| TIMED_OUT_OPEN_CHANNEL    | Trying to open a channel took too much time                 | Data about the channel                    |

</br>

\* This callback has only 1 parameter

The failure callbacks provide 2 parameters, the data related to the operation and a JS error, the JS error has some info about the issue,. </br>The data related to the error has the last successful state of the operation (for example the channel data before a deposit)

To set an error callback the process is the same as a non failure one, with a little difference:

```javascript
const callbackConst =
  Lumino.callbacks.names.CALLBACKS.CLIENT_ONBOARDING_FAILURE;
Lumino.callbacks.set(callbackConst, (data, error) => {
  /* do something...*/
});
```

## Examples

Follow this [link](examples/callbacks.js) for some examples and usages

The callbacks are recommended to use for displaying UX events, refreshing certains states and provide the best experience when creating a dApp

# RIF Notifier

The Light client is not aware of everything that happens in the blockchain and when events are really processed.

To tackle this problem, the RIF ecosystem has a Notifier, whose objective is to provide the information about events regarding what operations happen on the blockchain.

Those events are filtered by topics, which are abstracted by the SDK in order to avoid writing complex logic.

</br>

## How to use the notifier

The notifier is abstracted in simple methods that just need to be summoned, they are made in order to make very simple the RIF notifier integration.

</br>

## Registering with the notifier

```javascript
notifierRegistration(notifierURL: String) => Promise<void>
```

Registers the LC in the notifier that was passed in the config of `Lumino.init` you only need to call it once per initialization, since its data is stored.

</br>

## Listening to Open Channel events

```javascript
subscribeToOpenChannel(notifierURL: String) => Promise<void>
```

This method subscribes the LC to all the events of open channel where a partner creates a channel with them.

</br>

## Listening to Close Channel events

```javascript
subscribeToUserClosesChannelOnToken(notifierURL: String, tokenNetworkAddress: String) => Promise<void>
```

With this method, whenever the user closes a channel in an specific Token Network, the SDK will get these related events
</br>
NOTE: The token network address is available in the channel structure.

</br>

```javascript
subscribeToPartnerClosesSpecificChannel(notifierURL: String, channelId: Number, tokenNetworkAddress: String) => Promise<void>
```

With this method if the partner closes an X channel in the Y token network, the SDK will pull from the notifier the related events.

# Reproduce build

Run the next command:

```
npm run build
```
