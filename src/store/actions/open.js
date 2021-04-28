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
import { ISmartWalletFactory } from "./interfaces/SmartWalletFactory";
import { ILuminoToken } from "./interfaces/LuminoToken";
import { getWeb3 } from "../../utils/web3";
import { ZERO_ADDRESS } from "@rsksmart/rns/lib/constants";
import * as Enveloping from "@rsksmart/enveloping";
import AccountManager from "@rsksmart/enveloping/src/relayclient/AccountManager";

/**
 * Open a channel.
 * @param {string} unsigned_tx - An unsigned TX for opening a channel
 * @param {string} partner_address - The partner to open the channel with
 * @param {string} creator_address -  The address that wants to open the channel
 * @param {string} token_address -  The token address for the channel
 */
export const openChannel = params => async (dispatch, getState, lh) => {
  const { tokenAddress } = params;
  let internalChannelId = params.internalChannelId ? params.internalChannelId : UUIDv4();
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
  } catch (luminoError) {
    console.log("Lumino Error", luminoError);
    console.log("Trying open channel with enveloping");
    try {
      await openChannelOverEnveloping(lh, tokenAddress, clientAddress, params);
      const numberOfNotifiers = Object.keys(getState().notifier.notifiers).length;

      dispatch({
        type: OPEN_CHANNEL,
        channelId: internalChannelId,
        numberOfNotifiers,
        channel: {
          ...channel,
          token_symbol: "LUM",
          hubAnswered: true,
          openedByUser: true,
          token_name: "Lumino Token",
          sdk_status: SDK_CHANNEL_STATUS.CHANNEL_AWAITING_NOTIFICATION,
          internalChannelId,
        },
      });

      const allData = getState();
      await lh.storage.saveLuminoData(allData);
    } catch (envelopingError) {
      console.error("Enveloping error:", envelopingError);
      dispatch({
        type: REMOVE_CHANNEL_WAITING_FOR_OPENING,
        internalChannelId,
      });
      Lumino.callbacks.trigger(CALLBACKS.FAILED_OPEN_CHANNEL, channel, envelopingError);
    }
  }
};

async function openChannelOverEnveloping(lh, tokenAddress, clientAddress, params) {
  const SmartWalletFactoryAbi = ISmartWalletFactory.getAbi();
  const LuminoTokenAbi = ILuminoToken.getAbi();

  const web3 = getWeb3("http://rsk-node:4444");

  const txParams = {
    ...params,
    address: clientAddress,
    tokenNetworkAddress: getTokenNetworkByTokenAddress(tokenAddress),
  };

  const unsigned_tx = await createOpenTx(txParams);

  const relayVerifierContractAddress = "0x74Dc4471FA8C8fBE09c7a0C400a0852b0A9d04b2";
  const deployVerifierContractAddress = "0x1938517B0762103d52590Ca21d459968c25c9E67";
  const relayHubContractAddress = "0x3bA95e1cccd397b5124BcdCC5bf0952114E6A701";
  const smartWalletFactoryContractAddress = "0x8C1108cFCd7ddad09D8910e5f42982A6c54aD9cD";
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
    SmartWalletFactoryAbi,
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
      console.log(`Smart wallet ${smartWalletAddress} successfully funded with ${tokenAmount} lumino tokens. Balance: ${balance}`);
    } else {
      console.log(`No need to fund, the smart wallet has balance ${balance}`);
    }
  }

  console.log("Creating provider for web3");

  const accountManager = new AccountManager(web3.currentProvider, chainId, config, async (dataToSign) => {
    return await lh.sign(dataToSign);
  });

  const provider = new Enveloping.RelayProvider(web3.currentProvider, config, {
    accountManager
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
