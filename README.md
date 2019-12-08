# Lumino Light Client SDK

Lumino Light Client (or LC for short) is a Javascript SDK designed specifically to work with React Native and Web environments.

The SDK gives the developer all the functions to work with a Lumino HUB and interact with it, the SDK provides basic implementations and handlers for web environments, but leaving the freedom to the developer to implement them as they see fit.

# Pre-Requisites

- Web3JS
- Ethers.js

# Installing

yarn install lumino-light-client-sdk

OR
npm install --save lumino-light-client-sdk

## Starting

    import {Lumino} from 'lumino-light-client-sdk'

Lumino is our main interface to interact with the SDK.
Lumino must be initialized before being used, with the function `Lumino.init(config)` which accepts some config params

## Initialization

In order to initialize Lumino, the `Lumino.init(config)` method accepts the next params

## SigningHandler

This is an object with the next two methods

**sign = data: Transaction => signature**
Method that signs an Ethereum transaction (for example web3 signTransaction)

**offChainSign = data: ByteArray => signature: String**

Method that signs any kind of message, not transactions

**NOTE:** We strongly advise to use ethers.js Wallet for the **offChainSign** method, or other implementation that is capable of signing an array of bytes, if not the SDK could malfunction and operations could fail.

In order to make the setup more easier, we provided a default handler,
in the form of SigningHandler, which can be imported from the sdk

    import {SigningHandler} from 'lumino-light-client-sdk"

    const  signingHandler  =  SigningHandler();

    signingHandler.init(web3, PrivateKey);

The signingHandler accepts a web3 instance pointing to a provider, and a PrivateKey, with this, the handler could be passed to Lumino and it will work.

**Providing your own handler**

We support custom implementations, as long as an object with both of the prior methods are passed and can perform a correct signature, we encourage new implementations and research on the matter.

## LocalStorageHandler

Lumino in order to work must keep in persistance some data, if not the SDK would lose all of its data after the application is closed.

In order to do so, a storage implementation must be provided, this is an object with 2 methods.

**getLuminoData = () => Object**

This method returns the data that has been stored by the SDK, it could be any implementation (localStorage, AsyncStorage...), it supports async operations.

---

**saveLuminoData = data: Object => void**

This method saves the data that the SDK has stored in memory, implementations can also be of any type, it must accept a parameter (**data**) which is a JS object containing the data of the SDK.

    import {LocalStorageHandler} from 'lumino-light-client-sdk"

We also provide a default implementation of the handler in the SDK, this is for a web enviroment and can be imported from the SDK.

---

**Providing your own handler**

As in the Signing, we also support your own custom implementations, as long as the object of the handler has the required methods.

## ConfigParams

This is an object with the next params

| Name        | Description                 |
| ----------- | --------------------------- |
| chainId     | The chainId to use          |
| rskEndpoint | An endpoint to a RSK Node   |
| hubEndpoint | An endpoint to a Lumino HUB |
| address     | The Client address          |

## Initializing

With all the aforementioned values, Lumino can be initialized with the params in this order with the next ASYNC method.

**await Lumino.init(signingHandler, localStorageHandler,ConfigParams) => LuminoInstance**

    const lumino = await Lumino.init(luminoHandler, storageImplementation)

# How it Works

When we have a instance of Lumino we have to understand how it works and what are the steps to accomplish it

1.  Onboard the Client with the Hub in order to interact with it (Onboarding)
2.  Open a channel with a partner to send and receive payments with them (Open Channel)
3.  Deposit some tokens to make a payment (Deposit)
4.  Make a Payment (Payments)
5.  Close the channels to settle all the funds and get new onChain balance from the payments (Close Channel)

Even though Lumino may be simple at a first most of the logic behind it is abstracted, allowing the developer not to worry about strange and difficult logical decisions and focus on the User Experience.

For this we have also a series of Success Callbacks, so when an operation is completed, the developer can provide actual feedback to the user (Callbacks)

# Lumino

After Lumino has been initialized, new methods are exposed to be used

**get => luminoInstance**

Returns the intialized lumino instance, if lumino was not initialized before it will throw an error

The instance methods are the following

# lumino

**getLuminoInternalState => luminoInternalState**

Retrieves the internal state of SDK and returns it

Example: `lumino.getLuminoInternalState()`

---

**luminoInternalState**

This is the lumino internal state, it can be accessed directly in order to be inspected or make comparisons.

## Onboarding

Before any kind of operation can be processed, the SDK must be onboarded, for this we abstracted a method in the actions of Lumino

**Lumino.actions.onboardingClient = () => void**

**Async** method that request to the hub to start the process of onboarding, it resolves and stores an Api Key in the SDK data.

---

**Lumino.actions.getApiKey() = () => apiKey: String**

Method that returns the Apikey stored by the onboarding process, or an empty string if no onboarding was performed.

---

**Lumino.actions.setApiKey() = apiKey: String => void**

This method forces a new api key on the SDK, it will set it and then store it, so caution is advised when using it.

Example of an onboarding

    const lumino = Lumino.init(...)
    await lumino.actions.onboardingClient();

    // Not neccesary, SDK will store it.
    const apiKey = lumino.actions.getApiKey();

# Actions

Lumino has actions for many operations, all of them are usually under .actions, here we explain some of them, their use, parameters and return values.

**getChannels() => Object{channels}**

Returns a list of all lumino channels held in the internal state, regardless of their state.
The channels are identified by their channel identifier number and the token address where they were opened.

Example of channel key: 1-0x1234abc

---

**ON CHAIN Operations**

The next functions are considered **ON CHAIN** operations and will have a cost of RBTC, all of them are async functions and will take time depending on the type of Network (Regtest,Testnet,Mainnet).

**openChannel(requestBody) => void**

Opens a new channel with an address, the request body is the next:

    const requestBody = {
        partner_address: "0x123...",
        token_address: "0x987..."
    };

Optional params

| Name          | Description                              |
| ------------- | ---------------------------------------- |
| settleTimeout | Blocks for timeout to settle the channel |
| gasPrice      | The gas price to use in the transaction  |
| gasLimit      | The gas limit to use in the transaction  |

---

**createDeposit(requestBody) => void**

Deposits balance in a channel, the request body is the next:

    const requestBody = {
    	partner_address: "0x123...",
    	total_deposit: Number,
    	channelId: Number,
    	token_address: "0x987..."
    };

The amount of the deposit should be expressed in wei.

Optional params

| Name             | Description                                      |
| ---------------- | ------------------------------------------------ |
| gasPrice         | The gas price to use in the transaction          |
| gasLimitApproval | The gas limit to use in the approval transaction |
| gasLimitDeposit  | The gas limit to use in the deposit transaction  |

---

**closeChannel(requestBody) => void**

Requests the close of a channel that is opened, the requestBody is the next:

    const requestBody = {
    	partner_address: "0x123...",
    	channelId: Number
    	token_address: "0x987..."
    };

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

**createPayment(requestBody) => void**

This create a payment in a channel with balance, wheter it was from a deposit or from received payments, the body is the next:

    const requestBody = {
    	partner_address: "0x123...",
    	amount: Number,
    	token_address: "0x987..."
    };

The amount should be in wei, and should be equal or less than the balance of the channel, if a payment is requested with insufficent funds, the SDK will log an error and interrupt the process.

## Callbacks

Lumino provides a simple interfaces for callbacks, which are the ones that we trigger on certain actions and pass data regarding the action.
Thanks to this the developer can provide actual feedback to its users.

Callbacks are set on the **Lumino** instance like this:

    Lumino.callbacks.set.setNameOfCallback

The callbacks.set method sets a function that may or may not receive the data regarding the event, the next table illustrates the callbacks and the data they provide (Which is always a single object or nothing)

| Name                          | Description                                                    | Data                                  |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------- |
| setOnCompletedPaymentCallback | Fired when a received or sent payment is successfuly completed | The payment data                      |
| setOnReceivedPaymentCallback  | Fired when a payment is received                               | The payment data                      |
| setOnOpenChannelCallback      | Fired when a channel is Opened by the client or a partner      | The channel data                      |
| setOnChannelDepositCallback   | Fired when a channel deposit is successful                     | The channel data                      |
| setOnRequestClientOnboarding  | Fired when an Onboarding process is initiated                  | Address that requested the onboarding |
| setOnClientOnboardingSuccess  | Fired when an Onboarding process is successful                 | Address that requested the onboarding |

These callbacks all accept a function that executes any code and accept one parameter which is the returned data from the SDK.
