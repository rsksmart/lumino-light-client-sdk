import client from "../../apiRest";
import { createSettleTx } from "../../scripts/settle";
import resolver from "../../utils/handlerResolver";
import { getTokenAddressByTokenNetwork } from "../functions/tokens";

export const settleChannel = data => async (dispatch, getState, lh) => {
  const { txParams } = data;
  const unsignedTx = await createSettleTx(txParams);
  const signedTx = await resolver(unsignedTx, lh);
  const requestBody = {
    state: "waiting_for_settle",
    signed_settle_tx: signedTx,
    signed_approval_tx: "",
    signed_close_tx: "",
    signed_deposit_tx: "",
  };

  const { tokenNetworkAddress } = txParams;
  const tokenAddress = getTokenAddressByTokenNetwork(tokenNetworkAddress);
  const { creatorAddress, partnerAddress } = data;
  const url = `light_channels/${tokenAddress}/${creatorAddress}/${partnerAddress}`;
  try {
    const res = await client.patch(url, { ...requestBody });
    console.log("Settlement successful!", res.data);
  } catch (error) {
    console.error("Settlement failed!", error);
  }
};
