import { OPEN_CHANNEL } from "./types";
import { CHANNEL_OPENED } from "../../config/channelStates";
import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";
import { createOpenTx } from "../../scripts/open";

/**
 * Open a channel.
 * @param {string} unsigned_tx - An unsigned TX for opening a channel
 * @param {string} partner_address - The partner to open the channel with
 * @param {string} creator_address -  The address that wants to open the channel
 * @param {string} token_address -  The token address for the channel
 */
export const openChannel = params => async (dispatch, getState, lh) => {
  try {
    const { partner, tokenAddress } = params;

    const clientAddress = getState().client.address;
    const tokenRes = await client.get("tokens/" + tokenAddress)

    const txParams = {
      ...params,
      address: clientAddress,
      tokenNetworkAddress: tokenRes.data
    }

    const unsigned_tx = await createOpenTx(txParams);
    const signed_tx = await resolver(unsigned_tx, lh);
    try {
      const requestBody = {
        partner_address: partner,
        creator_address: clientAddress,
        token_address: tokenAddress,
        signed_tx,
      };
      
      const res = await client.put("light_channels", { ...requestBody });
      dispatch({
        type: OPEN_CHANNEL,
        channelId: res.data.channel_identifier,
        channel: {
          ...res.data,
          sdk_status: CHANNEL_OPENED,
        },
      });

      const allData = getState();
      await lh.storage.saveLuminoData(allData);
    } catch (apiError) {
      throw apiError;
    }
  } catch (resolverError) {
    throw resolverError;
  }
};
