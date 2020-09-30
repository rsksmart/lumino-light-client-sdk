import {
  DELETE_CHANNEL_FROM_SDK,
  SET_CHANNEL_CLOSED,
  SET_CHANNEL_AWAITING_CLOSE,
} from "./types";
import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";

import { createCloseTx } from "../../scripts/close";
import { saveLuminoData } from "./storage";
import { CHANNEL_WAITING_FOR_CLOSE } from "../../config/channelStates";
import { Lumino } from "../..";
import { CALLBACKS } from "../../utils/callbacks";
import { getChannelByIdAndToken } from "../functions";
import { getNumberOfNotifiers } from "../functions/notifiers";

/**
 * Close a channel.
 * @param {string} unsigned_tx- An unsigned close TX
 * @param {string} address -  The address of the creator of the channel
 * @param {string} partner -  The partner address
 * @param {string} token_address -  The address of the lumino token
 */
export const closeChannel = params => async (dispatch, getState, lh) => {
  const unsignedCloseTx = await createCloseTx(params);
  const signed_close_tx = await resolver(unsignedCloseTx, lh);

  const { address, partner, tokenAddress, channelIdentifier } = params;
  const channel = getChannelByIdAndToken(channelIdentifier, tokenAddress);

  try {
    const requestBody = {
      signed_approval_tx: "",
      signed_close_tx,
      signed_deposit_tx: "",
      state: "closed",
    };
    const url = `light_channels/${tokenAddress}/${address}/${partner}`;

    // Set the channel as waiting for close
    const actionToSetAwaitingClose = {
      type: SET_CHANNEL_AWAITING_CLOSE,
      channel,
    };
    dispatch(actionToSetAwaitingClose);

    const channelAwaitingClose = getChannelByIdAndToken(
      channelIdentifier,
      tokenAddress
    );

    Lumino.callbacks.trigger(
      CALLBACKS.REQUEST_CLOSE_CHANNEL,
      channelAwaitingClose
    );
    const res = await client.patch(url, { ...requestBody });
    const numberOfNotifiers = getNumberOfNotifiers().length;
    dispatch({
      type: SET_CHANNEL_CLOSED,
      channel: {
        ...res.data,
        sdk_status: CHANNEL_WAITING_FOR_CLOSE,
        numberOfNotifiers,
      },
    });
    const allData = getState();
    return await lh.storage.saveLuminoData(allData);
  } catch (error) {
    Lumino.callbacks.trigger(CALLBACKS.FAILED_CLOSE_CHANNEL, channel, error);
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
