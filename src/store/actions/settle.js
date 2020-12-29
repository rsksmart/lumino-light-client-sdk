import { Lumino } from "../..";
import client from "../../apiRest";
import { createSettleTx } from "../../scripts/settle";
import { CALLBACKS } from "../../utils/callbacks";
import resolver from "../../utils/handlerResolver";
import { getChannelByIdAndToken } from "../functions";
import { getTokenAddressByTokenNetwork } from "../functions/tokens";
import { saveLuminoData } from "./storage";
import { SET_CHANNEL_SETTLED, SET_IS_SETTLING } from "./types";

const SETTLED_EXPECTED_ERRORS = [
  "CHANNEL_ALREADY_SETTLED",
  "MESSAGE_ALREADY_SIGNED",
  "CHANNEL_UNLOCKED",
];

export const settleChannel = data => async (dispatch, _, lh) => {
  const { txParams, internal_msg_identifier } = data;
  const unsignedTx = await createSettleTx(txParams);
  const signedTx = await resolver(unsignedTx, lh);
  const { channelIdentifier } = txParams;

  const requestBody = {
    signed_settle_tx: signedTx,
    channel_identifier: channelIdentifier,
    internal_msg_identifier,
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
    const channel = getChannelByIdAndToken(channelIdentifier, tokenAddress);
    Lumino.callbacks.trigger(CALLBACKS.CHANNEL_HAS_SETTLED, channel);
    dispatch(saveLuminoData());
  } catch (error) {
    const requestError = error?.response?.data?.errors;
    if (requestError) {
      const channelAlreadySettled =
        SETTLED_EXPECTED_ERRORS.indexOf(requestError) !== -1;
      if (channelAlreadySettled) {
        dispatch(setChannelSettled(dispatchData));
        const channel = getChannelByIdAndToken(channelIdentifier, tokenAddress);
        Lumino.callbacks.trigger(CALLBACKS.CHANNEL_HAS_SETTLED, channel);
        dispatch(saveLuminoData());
      } else {
        console.error("Settlement failed!", error);
        return dispatch(saveLuminoData());
      }
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
