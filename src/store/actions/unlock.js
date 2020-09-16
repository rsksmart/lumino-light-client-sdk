import { Lumino } from "../..";
import client from "../../apiRest";
import { createUnlockTx } from "../../scripts/unlock";
import resolver from "../../utils/handlerResolver";
import { getTokenNetworkByTokenAddress } from "../functions/tokens";

export const unlockChannel = data => async (dispatch, getState, lh) => {
  const { address } = Lumino.getConfig();
  const { tokenAddress, channel_identifier, receiver, sender } = data;
  const tokenNetworkAddress = getTokenNetworkByTokenAddress(tokenAddress);
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
    const res = await client.post(url, body);
    console.log("Unlock success!", res.data);
  } catch (error) {
    console.error("Unlock error!", error);
  }
};
