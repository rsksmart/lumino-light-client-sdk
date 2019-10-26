# Lumino Light Client SDK

Lumino Light Client (or LC for short) is a Javascript SDK designed specifically to work with React Native and web environments.

The SDK gives the developer all the functions to work with a Lumino HUB and interact with it, allowing the developer to give their own implementations for storing information and signing data.

# Pre-Requisites

- web3js

# Installing

    yarn install lumino-light-client-sdk

## Starting

    import Lumino from 'lumino-light-client-sdk'

    const luminoHandler = {
        sign: onChainSignFn(data),
        offChainSign: offChainSignFn(data)
     }

    const storageImplementation = {
        saveLuminoData: saveFn(data),
        getLuminoData: getDataFn(data)
    }

    const lumino = await Lumino.init(luminoHandler, storageImplementation)

## Initialization methods

All the methods for LCSDK sign and storage management are provided by the developer, we abstract the interaction with the Lumino HUB, so you can provide any interactions that you want in your app flow.

### onChaingSignFn(String data) => Promise<(String)>

A function that receives data and resolves a promise to return that data signed

### offChainSignFn(String data) => Promise<(String)>

A function that receives data and resolves a promise to return that data signed, ONLY for off chain operations.

### saveLuminoData(Object data) => void

Function that saves all the LCSDK internal state in order to be loaded in case that the app is reset (LocalStorage, AsyncStorage).

### getLuminoData() => Object

Function that returns the saved LCSDK state

# Lumino

    get() => luminoInstance

Returns the intialized lumino instance, if lumino was not initialized before it will throw an error

The instance methods are the following

# lumino

    changesHook(callbackFn) => void

This function receives a callback that will be executed any time that the LCSDK internal state changes, it is useful to attach subscribe methods to update state and query the storage to get the latest LCSDK data

---

    getLuminoInternalState() => luminoInternalState

Retrieves the internal state of LCSDK and returns it

     luminoInternalState

This is the lumino internal state, it can be accessed directly in order to be inspected or make comparisons.

# lumino.actions

    getChannels() => Array[channels]

Returns a list of all lumino channels held in the internal state, regardless of their state.

---

**(ON CHAIN)**

    openChannel(requestBody) => void

Opens a new channel with an address, the request body is the next:

    const  requestBody  = {
    	partner_address: "0x123...",
    	creator_address:  "0x321...",
    	unsigned_tx: openChannelUnsignedTx
    	token_address: "0x987..."
    };

How to get the unsigned_tx is up to the user.

---

**(ON CHAIN)**

    createDeposit(requestBody) => void

Deposits balance in a channel, the request body is the next:
const requestBody = {
partner_address: "0x123...",
creator_address: "0x321...",
unsigned_approval_tx: openChannelUnsignedTx
unsigned_deposit_tx: depositUnsginedTx
total_deposit: Number,
token_address: "0x987..."
};

Total deposit should be in ...

---

**(ON CHAIN)**

    closeChannel(requestBody) => void

Requests the close of a channel, the requestBody is the next:

    const  requestBody  = {
    	partner_address: "0x123...",
    	creator_address:  "0x321...",
    	unsigned_tx: closeChannelUnsignedTx
    	token_address: "0x987..."
    };

How to get the unsigned_tx is up to the user.

---

**(OFF CHAIN)**

    createPayment(requestBody) => void

This create a payment in a channel with deposit, the body is the next:

    const  requestBody  = {
    	partner_address: "0x123...",
    	creator_address:  "0x321...",
    	amount: X,
    	token_address: "0x987..."
    };

The amount should be in ... , and should be equal or less than the total deposit of the channel.
