// This a sample walkthrough to init a lumino instance

// The methods get and set are methods that save to LocalStorage the lumino data
// One saves the data, the other fetches it
const storageHandler = { getLuminoData, saveLuminoData };

// The config params are compulsory to initiate lumino
// The address should be the address of the LC
// The api key should be the one got in the onboarding
// TODO: Store api_key in LC data
const configParams = {
  chainId: 33,
  rskEndpoint: "http://localhost:444",
  hubEndpoint: "http://localhost:500/api/v1",
  address: "0xc19BBF5E4F1709230EBe2552dc15C692FE8DEf83",
  apiKey: "abxd123",
};

// The signature handler has to have 2 methods, sign and offChain sign.
// The sign method has to accept a tx and sign it with a private key
// The offchain method has to accept an array of bytes and sign it (recommende ether.js wallet sign)
const signatureHandler = {
  sign: signTransaction,
  offChainSign,
};

// This method intiliazes a lumino instance with the aforementioned config.
const lumino = await Lumino.init(
  signatureHandler,
  storageHandler,
  configParams
);

// After being instantiated, lumino can be accessed by calling .get()
const lumino = Lumino.get();

// To open a channel, one has to provide the next params
const paramsOpenChannel = {
  tokenNetworkAddress,
  address,
  gasPrice: "0x098bca5a00",
  gasLimit: "0x0304b1",
  partner,
  settleTimeout: 500,
  tokenAddress: token_address,
};

// This function resolves to a promise
await lumino.actions.openChannel(params);

// These are the ones for a deposit
const total_deposit = "1000000000000000";
const paramsDeposit = {
  address,
  tokenAddress: token_address,
  gasPrice: "0x098bca5a00",
  gasLimitApproval: "0x012527",
  gasLimitDeposit: "0x0304b1",
  tokenNetworkAddress,
  amount: total_deposit,
  channelId: channel_identifier,
  address,
  partner,
};
await lumino.actions.createDeposit(params);

// For creating a payment

const amount = "10000000000";
const body = {
  partner,
  address,
  token_address,
  amount,
};
await lumino.actions.createPayment(body);
