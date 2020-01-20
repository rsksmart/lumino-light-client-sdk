import { NEW_DEPOSIT } from "./types";
import { CHANNEL_OPENED } from "../../config/channelStates";
import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";
import { createApprovalTx, createDepositTx } from "../../scripts/deposit";

/**
 * Create a deposit.
 * @param {string} unsigned_approval_tx - An unsigned approval TX
 * @param {string} unsigned_deposit_tx -  An unsigned deposit TX
 * @param {string} address -  The address that wants to deposit
 * @param {string} partner -  The target address to receive the deposit
 * @param {string} total_deposit -  The amount to deposit
 */
export const createDeposit = params => async (dispatch, getState, lh) => {
  try {
    const clientAddress = getState().client.address;

    const txParams = {
      ...params,
      address: clientAddress,
    };
    const unsignedApprovalTx = await createApprovalTx(txParams);
    const unsignedDepositTx = await createDepositTx(txParams);
    const signed_approval_tx = await resolver(unsignedApprovalTx, lh);
    const signed_deposit_tx = await resolver(unsignedDepositTx, lh);
    try {
      const { amount, partner, tokenAddress } = params;
      const requestBody = {
        total_deposit: amount,
        signed_approval_tx,
        signed_deposit_tx,
        signed_close_tx: "",
      };
      const url = `light_channels/${tokenAddress}/${clientAddress}/${partner}`;
      const res = await client.patch(url, { ...requestBody });
      dispatch({
        type: NEW_DEPOSIT,
        channel: { ...res.data, sdk_status: CHANNEL_OPENED },
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
