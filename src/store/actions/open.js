import {
  OPEN_CHANNEL,
  ADD_CHANNEL_WAITING_FOR_OPENING,
  REMOVE_CHANNEL_WAITING_FOR_OPENING,
} from "./types";
import { SDK_CHANNEL_STATUS } from "../../config/channelStates";
import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";
import { createOpenTx } from "../../scripts/open";
import {
  isRnsDomain,
  findNonClosedChannelWithPartner,
  UUIDv4,
} from "../../utils/functions";
import { getRnsInstance } from "../functions/rns";
import {
  getTokenNetworkByTokenAddress,
  requestTokenNameAndSymbol,
} from "../functions/tokens";
import { requestTokenNetworkFromTokenAddress } from "./tokens";
import { Lumino } from "../..";
import { CALLBACKS } from "../../utils/callbacks";
import { TIMEOUT_MAP } from "../../utils/timeoutValues";
import Axios from "axios";
import { ethers } from "ethers";
import * as Enveloping from "@rsksmart/enveloping";
import { getWeb3 } from "../../utils/web3";
import { ZERO_ADDRESS } from "@rsksmart/rns/lib/constants";

/**
 * Open a channel.
 * @param {string} unsigned_tx - An unsigned TX for opening a channel
 * @param {string} partner_address - The partner to open the channel with
 * @param {string} creator_address -  The address that wants to open the channel
 * @param {string} token_address -  The token address for the channel
 */
export const openChannel = params => async (dispatch, getState, lh) => {
  const { tokenAddress } = params;
  let internalChannelId = params.internalChannelId
    ? params.internalChannelId
    : UUIDv4();
  let { partner } = params;
  const { getAddress } = ethers.utils;

  // Check if partner is a rns domain
  if (isRnsDomain(partner)) {
    const rns = getRnsInstance();
    partner = await rns.addr(partner);
    console.log("Resolved address", partner);
    if (partner === "0x0000000000000000000000000000000000000000") {
      Lumino.callbacks.trigger(
        CALLBACKS.FAILED_OPEN_CHANNEL,
        channel,
        "RNS domain isnt registered"
      );
    } else {
      params.partner = partner;
    }
  }

  let channel = {
    partner: getAddress(partner),
  };
  const clientAddress = getAddress(getState().client.address);
  const channels = getState().channelReducer;
  const nonClosedChannelWithPartner = findNonClosedChannelWithPartner(
    channels,
    channel.partner,
    tokenAddress
  );

  try {
    if (getAddress(partner) === clientAddress)
      throw new Error("Can't create channel with yourself");
    if (nonClosedChannelWithPartner)
      throw new Error(
        "A non closed channel exists with partner already on that token"
      );

    let tokenNetwork = getTokenNetworkByTokenAddress(tokenAddress);
    if (!tokenNetwork) {
      tokenNetwork = await dispatch(
        requestTokenNetworkFromTokenAddress(tokenAddress)
      );
    }

    const txParams = {
      ...params,
      address: clientAddress,
      tokenNetworkAddress: tokenNetwork,
    };

    const unsigned_tx = await createOpenTx(txParams);
    const signed_tx = await resolver(unsigned_tx, lh);
    const {
      name: token_name,
      symbol: token_symbol,
    } = await requestTokenNameAndSymbol(tokenAddress);

    const requestBody = {
      partner_address: partner,
      creator_address: clientAddress,
      token_address: tokenAddress,
    };

    channel = {
      ...requestBody,
      token_name,
      token_symbol,
      internalChannelId,
    };

    requestBody.signed_tx = signed_tx;

    // Timeout setup
    const { chainId } = Lumino.getConfig().chainId;
    const currentTimeout = TIMEOUT_MAP[chainId] || TIMEOUT_MAP[30];
    // Cancellation setup
    const CancelToken = Axios.CancelToken;
    const source = CancelToken.source();

    const timeoutId = setTimeout(() => {
      Lumino.callbacks.trigger(
        CALLBACKS.TIMED_OUT_OPEN_CHANNEL,
        channel,
        new Error("The operation took too much time")
      );
      source.cancel();
    }, currentTimeout);

    dispatch({
      type: ADD_CHANNEL_WAITING_FOR_OPENING,
      channel: { ...channel, offChainBalance: "0" },
    });
    Lumino.callbacks.trigger(CALLBACKS.REQUEST_OPEN_CHANNEL, channel);

    const res = await client.put(
      "light_channels",
      { ...requestBody },
      { cancelToken: source.token }
    );

    clearTimeout(timeoutId);

    const numberOfNotifiers = Object.keys(getState().notifier.notifiers).length;

    dispatch({
      type: OPEN_CHANNEL,
      channelId: res.data.channel_identifier,
      numberOfNotifiers,
      channel: {
        ...res.data,
        token_symbol,
        hubAnswered: true,
        openedByUser: true,
        token_name,
        sdk_status: SDK_CHANNEL_STATUS.CHANNEL_AWAITING_NOTIFICATION,
        internalChannelId,
      },
    });

    const allData = getState();
    await lh.storage.saveLuminoData(allData);
  } catch (error) {
    console.error("Lumino Error", error);
    try {
      await openChannelOverEnveloping(tokenAddress, clientAddress, params);
    } catch (envelopingError) {
      console.error("Enveloping Error", envelopingError);
      dispatch({
        type: REMOVE_CHANNEL_WAITING_FOR_OPENING,
        internalChannelId,
      });
      Lumino.callbacks.trigger(CALLBACKS.FAILED_OPEN_CHANNEL, channel, error);
    }
  }
};

async function openChannelOverEnveloping(tokenAddress, clientAddress, params) {
  const ISmartWalletFactory = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "addr",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "salt",
          type: "uint256",
        },
      ],
      name: "Deployed",
      type: "event",
    },
    {
      inputs: [],
      name: "getCreationBytecode",
      outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "from", type: "address" }],
      name: "nonce",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "address", name: "relayHub", type: "address" },
            { internalType: "address", name: "from", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "address", name: "tokenContract", type: "address" },
            { internalType: "address", name: "recoverer", type: "address" },
            { internalType: "uint256", name: "value", type: "uint256" },
            { internalType: "uint256", name: "gas", type: "uint256" },
            { internalType: "uint256", name: "nonce", type: "uint256" },
            { internalType: "uint256", name: "tokenAmount", type: "uint256" },
            { internalType: "uint256", name: "tokenGas", type: "uint256" },
            { internalType: "uint256", name: "index", type: "uint256" },
            { internalType: "bytes", name: "data", type: "bytes" },
          ],
          internalType: "struct IForwarder.DeployRequest",
          name: "req",
          type: "tuple",
        },
        { internalType: "bytes32", name: "domainSeparator", type: "bytes32" },
        { internalType: "bytes32", name: "suffixData", type: "bytes32" },
        { internalType: "bytes", name: "sig", type: "bytes" },
      ],
      name: "relayedUserSmartWalletCreation",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "runtimeCodeHash",
      outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "recoverer", type: "address" },
        { internalType: "uint256", name: "index", type: "uint256" },
        { internalType: "bytes", name: "sig", type: "bytes" },
      ],
      name: "createUserSmartWallet",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "recoverer", type: "address" },
        { internalType: "uint256", name: "index", type: "uint256" },
      ],
      name: "getSmartWalletAddress",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
  ];
  const LuminoTokenAbi = [
    {
      constant: true,
      inputs: [],
      name: "name",
      outputs: [{ name: "", type: "string" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "_spender", type: "address" },
        { name: "_value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ name: "success", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "totalSupply",
      outputs: [{ name: "supply", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "multiplier",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "_from", type: "address" },
        { name: "_to", type: "address" },
        { name: "_value", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [{ name: "success", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [{ name: "", type: "address" }],
      name: "balances",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "decimals",
      outputs: [{ name: "decimals", type: "uint8" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "_decimals",
      outputs: [{ name: "", type: "uint8" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [],
      name: "transferFunds",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "version",
      outputs: [{ name: "", type: "string" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "owner_address",
      outputs: [{ name: "", type: "address" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "symbol",
      outputs: [{ name: "", type: "string" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [{ name: "num", type: "uint256" }],
      name: "mint",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "_to", type: "address" },
        { name: "_value", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ name: "success", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "num", type: "uint256" },
        { name: "target", type: "address" },
      ],
      name: "mintFor",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [
        { name: "_owner", type: "address" },
        { name: "_spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ name: "remaining", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { name: "initial_supply", type: "uint256" },
        { name: "decimal_units", type: "uint8" },
        { name: "token_name", type: "string" },
        { name: "token_symbol", type: "string" },
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "_to", type: "address" },
        { indexed: true, name: "_num", type: "uint256" },
      ],
      name: "Minted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "_from", type: "address" },
        { indexed: true, name: "_to", type: "address" },
        { indexed: false, name: "_value", type: "uint256" },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "_owner", type: "address" },
        { indexed: true, name: "_spender", type: "address" },
        { indexed: false, name: "_value", type: "uint256" },
      ],
      name: "Approval",
      type: "event",
    },
  ];

  const web3 = getWeb3("http://rsk-node:4444");

  const txParams = {
    ...params,
    address: clientAddress,
    tokenNetworkAddress: getTokenNetworkByTokenAddress(tokenAddress),
  };

  const unsigned_tx = await createOpenTx(txParams);

  const relayVerifierContractAddress =
    "0x74Dc4471FA8C8fBE09c7a0C400a0852b0A9d04b2";
  const deployVerifierContractAddress =
    "0x1938517B0762103d52590Ca21d459968c25c9E67";
  const relayHubContractAddress = "0x3bA95e1cccd397b5124BcdCC5bf0952114E6A701";
  const smartWalletFactoryContractAddress =
    "0x8C1108cFCd7ddad09D8910e5f42982A6c54aD9cD";
  const chainId = 33;

  console.log("Resolving configuration for enveloping");

  const config = await Enveloping.resolveConfiguration(web3.currentProvider, {
    verbose: window.location.href.includes("verbose"),
    onlyPreferredRelays: true,
    preferredRelays: ["http://localhost:8090"],
    factory: smartWalletFactoryContractAddress,
    gasPriceFactorPercent: 0,
    relayLookupWindowBlocks: 1e5,
    chainId,
    relayVerifierAddress: relayVerifierContractAddress,
    deployVerifierAddress: deployVerifierContractAddress,
    smartWalletFactoryAddress: smartWalletFactoryContractAddress,
  });

  config.relayHubAddress = relayHubContractAddress;

  console.log("Enveloping config", config);

  console.log("Generating computed address for smart wallet");

  const tokenAmount = 100;
  const smartWalletAddress = await new web3.eth.Contract(
    ISmartWalletFactory,
    smartWalletFactoryContractAddress
  ).methods
    .getSmartWalletAddress(clientAddress, ZERO_ADDRESS, 0)
    .call();

  console.log("Checking if the wallet already exists");

  let code = await web3.eth.getCode(smartWalletAddress);

  if (code === "0x00" || code === "0x") {
    console.warn("Funding smart wallet before deploying it...");

    const luminoToken = await new web3.eth.Contract(
      LuminoTokenAbi,
      tokenAddress
    );

    let balance = await luminoToken.methods
      .balanceOf(smartWalletAddress)
      .call();

    if (balance <= 0) {
      const accounts = await web3.eth.getAccounts();
      await luminoToken.methods
        .transfer(
          smartWalletAddress,
          web3.utils.toWei(tokenAmount.toString(), "ether")
        )
        .send({ from: accounts[0] });
      balance = await luminoToken.methods.balanceOf(smartWalletAddress).call();
      console.log(
        `Smart wallet ${smartWalletAddress} successfully funded with ${tokenAmount} lumino tokens. Balance: ${balance}`
      );
    } else {
      console.log(`No need to fund, the smart wallet has balance ${balance}`);
    }
  }

  console.log("Creating provider for web3");

  const provider = new Enveloping.RelayProvider(web3.currentProvider, config);

  provider.addAccount({
    address: clientAddress,
    privateKey: Buffer.from(
      "c2decf57baed5c1f4e576dc04eab97edb753c72723720af95f14c3ac1e3ef830",
      "hex"
    ),
  });

  web3.setProvider(provider);

  if (code === "0x00" || code === "0x") {
    console.log("Deploying smart wallet for address", smartWalletAddress);

    const transaction = await provider.deploySmartWallet({
      from: clientAddress,
      to: ZERO_ADDRESS,
      gas: "0x27100",
      value: "0",
      callVerifier: deployVerifierContractAddress,
      callForwarder: smartWalletFactoryContractAddress,
      tokenContract: tokenAddress,
      tokenAmount: tokenAmount.toString(),
      data: "0x",
      index: "0",
      recoverer: ZERO_ADDRESS,
      isSmartWalletDeploy: true,
      onlyPreferredRelays: true,
      smartWalletAddress: smartWalletAddress,
    });

    console.log("Smart wallet successfully deployed", transaction);
  }

  // wait until the deploy it's done
  while (code === "0x00" || code === "0x") {
    code = await web3.eth.getCode(smartWalletAddress);
  }

  console.log(`Smart wallet code is ${code}`);

  console.log("Sending relay transaction");

  const tx = await web3.eth.sendTransaction({
    from: clientAddress,
    callVerifier: relayVerifierContractAddress,
    callForwarder: smartWalletAddress,
    isSmartWalletDeploy: false,
    onlyPreferredRelays: true,
    tokenAmount: "10",
    tokenContract: tokenAddress,
    ...unsigned_tx,
  });

  console.log("Transaction successfully executed", tx);
}
