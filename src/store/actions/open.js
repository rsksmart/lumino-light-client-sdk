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

/**
 * Open a channel.
 * @param {string} unsigned_tx - An unsigned TX for opening a channel
 * @param {string} partner_address - The partner to open the channel with
 * @param {string} creator_address -  The address that wants to open the channel
 * @param {string} token_address -  The token address for the channel
 */
export const openChannel = params => async (dispatch, getState, lh) => {
  const { tokenAddress } = params;
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

  const internalChannelId = UUIDv4();

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
      },
    });

    const allData = getState();
    await lh.storage.saveLuminoData(allData);
  } catch (error) {
    dispatch({
      type: REMOVE_CHANNEL_WAITING_FOR_OPENING,
      internalChannelId,
    });
    Lumino.callbacks.trigger(CALLBACKS.FAILED_OPEN_CHANNEL, channel, error);
  }
};
