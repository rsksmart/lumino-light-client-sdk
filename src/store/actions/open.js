import { OPEN_CHANNEL } from "./types";
import { SDK_CHANNEL_STATUS } from "../../config/channelStates";
import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";
import { createOpenTx } from "../../scripts/open";
import {isRnsDomain} from "../../utils/functions";
import {
  getRnsInstance
} from "../functions/rns";
import {
  getTokenNetworkByTokenAddress,
  requestTokenNameAndSymbol,
} from "../functions/tokens";
import { requestTokenNetworkFromTokenAddress } from "./tokens";
import { Lumino } from "../..";
import { CALLBACKS } from "../../utils/callbacks";

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

  // Check if partner is a rns domain
  if(isRnsDomain(partner)){
    const rns = getRnsInstance();
    partner = await rns.addr(partner);
    console.log("Resolved address", partner);
    if (partner === "0x0000000000000000000000000000000000000000"){
      Lumino.callbacks.trigger(CALLBACKS.FAILED_OPEN_CHANNEL, channel, "RNS domain isnt registered");
      console.error(error);
    }else{
      params.partner = partner;
    }
  }

  const clientAddress = getState().client.address;
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
  let channel = {};
  try {
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
    };

    requestBody.signed_tx = signed_tx;

    Lumino.callbacks.trigger(CALLBACKS.REQUEST_OPEN_CHANNEL, channel);
    const res = await client.put("light_channels", { ...requestBody });

    dispatch({
      type: OPEN_CHANNEL,
      channelId: res.data.channel_identifier,
      channel: {
        ...res.data,
        token_symbol,
        token_name,
        sdk_status: SDK_CHANNEL_STATUS.CHANNEL_AWAITING_NOTIFICATION,
      },
    });

    const allData = getState();
    await lh.storage.saveLuminoData(allData);
  } catch (error) {
    Lumino.callbacks.trigger(CALLBACKS.FAILED_OPEN_CHANNEL, channel, error);
  }
};
