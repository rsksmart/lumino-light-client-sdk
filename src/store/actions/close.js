import { SET_CHANNEL_CLOSED, DELETE_CHANNEL_FROM_SDK } from "./types";
import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";
import { CHANNEL_CLOSED } from "../../config/channelStates";
import { createCloseTx } from "../../scripts/close";
import { saveLuminoData } from "./storage";

/**
 * Create a deposit.
 * @param {string} unsigned_tx- An unsigned close TX
 * @param {string} address -  The address of the creator of the channel
 * @param {string} partner -  The partner address
 * @param {string} token_address -  The address of the lumino token
 */
export const closeChannel = params => async (dispatch, getState, lh) => {
  try {
    const unsignedCloseTx = await createCloseTx(params);
    const signed_close_tx = await resolver(unsignedCloseTx, lh);
    try {
      const { address, partner, tokenAddress } = params;
      const requestBody = {
        signed_approval_tx: "",
        signed_close_tx,
        signed_deposit_tx: "",
        state: "closed",
      };
      const url = `light_channels/${tokenAddress}/${address}/${partner}`;
      const res = await client.patch(url, { ...requestBody });
      dispatch({
        type: SET_CHANNEL_CLOSED,
        channel: { ...res.data, sdk_status: CHANNEL_CLOSED },
      });
      const allData = getState();
      return await lh.storage.saveLuminoData(allData);
    } catch (apiError) {
      throw apiError;
    }
  } catch (resolverError) {
    throw resolverError;
  }
};

export const deleteChannelFromSDK = (id, tokenAddress) => dispatch => {
  dispatch({
    type: DELETE_CHANNEL_FROM_SDK,
    id,
    token_address: tokenAddress,
  });
  dispatch(saveLuminoData());
};
