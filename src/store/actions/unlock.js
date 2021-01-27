import { Lumino } from "../..";
import client from "../../apiRest";
import { createUnlockTx } from "../../scripts/unlock";
import { CALLBACKS } from "../../utils/callbacks";
import resolver from "../../utils/handlerResolver";
import { getChannelByIdAndToken } from "../functions";
import { getTokenNetworkByTokenAddress } from "../functions/tokens";
import { SET_CHANNEL_UNLOCKED, SET_IS_UNLOCKING } from "./types";

export const unlockChannel = data => async (dispatch, getState, lh) => {
  const { address } = Lumino.getConfig();
  const {
    merkle_tree_leaves: leaves,
    token_address: tokenAddress,
    channel_identifier,
    receiver,
    sender,
    internal_msg_identifier,
  } = data;
  const tokenNetworkAddress = getTokenNetworkByTokenAddress(tokenAddress);
  const dispatchData = { channel_identifier, token_address: tokenAddress };
  const txParams = {
    address,
    tokenNetworkAddress,
    channelIdentifier: channel_identifier,
    receiver,
    sender,
    leaves,
  };

  const unsignedTx = await createUnlockTx(txParams);
  const signedTx = await resolver(unsignedTx, lh);
  const body = { signed_tx: signedTx, internal_msg_identifier };
  const url = `payments_light/unlock/${tokenAddress}`;

  try {
    dispatch(setChannelIsUnlocking({ ...dispatchData, isUnlocking: true }));
    const res = await client.post(url, body);
    console.log("Unlock success!", res.data);
    dispatch(setChannelUnlocked(dispatchData));
    triggerUnlockCB(dispatchData);
  } catch (error) {
    dispatch(setChannelIsUnlocking({ ...dispatchData, isUnlocking: false }));
    console.error("Unlock error!", error);
  }
};

const triggerUnlockCB = data => {
  const { channel_identifier, token_address } = data;
  const channel = getChannelByIdAndToken(channel_identifier, token_address);
  Lumino.callbacks.trigger(CALLBACKS.CHANNEL_HAS_BEEN_UNLOCKED, channel);
};

const setChannelIsUnlocking = data => dispatch =>
  dispatch({ type: SET_IS_UNLOCKING, data });

const setChannelUnlocked = data => dispatch =>
  dispatch({ type: SET_CHANNEL_UNLOCKED, data });
