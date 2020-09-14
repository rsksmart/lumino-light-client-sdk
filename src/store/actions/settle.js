import client from "../../apiRest";
import { createSettleTx } from "../../scripts/settle";
import resolver from "../../utils/handlerResolver";
import { getTokenAddressByTokenNetwork } from "../functions/tokens";
import { SET_CHANNEL_SETTLED } from "./types";

export const settleChannel = data => async (dispatch, getState, lh) => {
  const { txParams } = data;
  const unsignedTx = await createSettleTx(txParams);
  const signedTx = await resolver(unsignedTx, lh);
  const requestBody = {
    state: "waiting_for_settle",
    signed_settle_tx: signedTx,
  };

  const { tokenNetworkAddress } = txParams;
  const tokenAddress = getTokenAddressByTokenNetwork(tokenNetworkAddress);
  const { creatorAddress, partnerAddress } = data;
  const url = `light_channels/${tokenAddress}/${creatorAddress}/${partnerAddress}/settle`;
  try {
    const res = await client.post(url, { ...requestBody });
    console.log("Settlement successful!", res.data);

    const { channelIdentifier } = txParams;
    const dispatchData = {
      channel_identifier: channelIdentifier,
      token_address: tokenAddress,
    };
    dispatch(setChannelSettled(dispatchData));
  } catch (error) {
    console.error("Settlement failed!", error);
  }
};

const setChannelSettled = data => dispatch =>
  dispatch({ type: SET_CHANNEL_SETTLED, data });
