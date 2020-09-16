import { Lumino } from "../..";
import client from "../../apiRest";
import { createUnlockTx } from "../../scripts/unlock";
import resolver from "../../utils/handlerResolver";
import { getTokenNetworkByTokenAddress } from "../functions/tokens";
import { SET_CHANNEL_UNLOCKED, SET_IS_UNLOCKING } from "./types";

export const unlockChannel = data => async (dispatch, getState, lh) => {
  const { address } = Lumino.getConfig();
  const { tokenAddress, channel_identifier, receiver, sender } = data;
  const tokenNetworkAddress = getTokenNetworkByTokenAddress(tokenAddress);
  const dispatchData = { channel_identifier, token_address: tokenAddress };
  const txParams = {
    address,
    tokenNetworkAddress,
    channelIdentifier: channel_identifier,
    receiver,
    sender,
  };

  const unsignedTx = await createUnlockTx(txParams);
  const signedTx = await resolver(unsignedTx, lh);
  const body = { signed_tx: signedTx };
  const url = `payments_light/unlock/${tokenAddress}`;

  try {
    dispatch(setChannelIsUnlocking({ ...dispatchData, isUnlocking: true }));
    const res = await client.post(url, body);
    console.log("Unlock success!", res.data);
    dispatch(setChannelUnlocked(dispatchData));
  } catch (error) {
    dispatch(setChannelIsUnlocking({ ...dispatchData, isUnlocking: false }));
    console.error("Unlock error!", error);
  }
};

export const setChannelIsUnlocking = data => dispatch =>
  dispatch({ type: SET_IS_UNLOCKING, data });

export const setChannelUnlocked = data => dispatch =>
  dispatch({ type: SET_CHANNEL_UNLOCKED, data });
