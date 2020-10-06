import { Lumino } from "../..";
import client from "../../apiRest";
import { createSettleTx } from "../../scripts/settle";
import { CALLBACKS } from "../../utils/callbacks";
import resolver from "../../utils/handlerResolver";
import { getTokenAddressByTokenNetwork } from "../functions/tokens";
import { saveLuminoData } from "./storage";
import { SET_CHANNEL_SETTLED, SET_IS_SETTLING } from "./types";

export const settleChannel = data => async (dispatch, getState, lh) => {
  const { txParams, internal_message_identifier } = data;
  const unsignedTx = await createSettleTx(txParams);
  const signedTx = await resolver(unsignedTx, lh);
  const { channelIdentifier } = txParams;

  const requestBody = {
    signed_settle_tx: signedTx,
    channel_identifier: channelIdentifier,
    internal_message_identifier,
  };
  const { tokenNetworkAddress } = txParams;
  const tokenAddress = getTokenAddressByTokenNetwork(tokenNetworkAddress);
  const { creatorAddress, partnerAddress } = data;
  const dispatchData = {
    channel_identifier: channelIdentifier,
    token_address: tokenAddress,
  };
  const url = `light_channels/${tokenAddress}/${creatorAddress}/${partnerAddress}/settle`;
  try {
    dispatch(setChannelIsSettling({ ...dispatchData, isSettling: true }));
    await client.post(url, { ...requestBody });

    dispatch(setChannelSettled(dispatchData));
    const channelKey = `${channelIdentifier}-${tokenAddress}`;
    const channel = getState().channelReducer[channelKey];
    Lumino.callbacks.trigger(CALLBACKS.CHANNEL_HAS_SETTLED, channel);
    dispatch(saveLuminoData());
  } catch (error) {
    console.error("Settlement failed!", error);
    // Already unlocked error
    const alreadyUnlockErr = "Channel is already unlocked.";
    const alreadySettledErr = "channel that's already settled";
    const wasUnlocked = error?.response?.data?.errors?.includes(
      alreadyUnlockErr
    );
    const wasSettled = error?.response?.data?.errors?.includes(
      alreadySettledErr
    );
    if (wasSettled || wasUnlocked) {
      dispatch(setChannelSettled(dispatchData));
      return dispatch(saveLuminoData());
    }
    return dispatch(
      setChannelIsSettling({ ...dispatchData, isSettling: false })
    );
  }
};

const setChannelSettled = data => dispatch =>
  dispatch({ type: SET_CHANNEL_SETTLED, data });

const setChannelIsSettling = data => dispatch =>
  dispatch({ type: SET_IS_SETTLING, data });
