import { NEW_DEPOSIT } from "./types";
import { CHANNEL_OPENED } from "../../config/channelStates";
import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";
import { createApprovalTx, createDepositTx } from "../../scripts/deposit";
import { getChannelByIdAndToken } from "../functions";
import { Lumino } from "../..";
import { CALLBACKS } from "../../utils/callbacks";
import BigNumber from "bignumber.js";
import { isRnsDomain } from "../../utils/functions";
import { getRnsInstance } from "../functions/rns";

/**
 * Create a deposit.
 * @param {string} unsigned_approval_tx - An unsigned approval TX
 * @param {string} unsigned_deposit_tx -  An unsigned deposit TX
 * @param {string} address -  The address that wants to deposit
 * @param {string} partner -  The target address to receive the deposit
 * @param {string} total_deposit -  The amount to deposit
 */
export const createDeposit = params => async (dispatch, getState, lh) => {
  const { channelId, tokenAddress } = params;
  let { amount } = params;
  const channel = getChannelByIdAndToken(channelId, tokenAddress);
  const { total_deposit } = channel;
  amount = new BigNumber(amount).plus(total_deposit).toString();

  try {
    const clientAddress = getState().client.address;
    let { partner } = params;

    // Check if partner is a rns domain
    if (isRnsDomain(partner)) {
      const rns = getRnsInstance();
      partner = await rns.addr(partner);
      console.log("Resolved address", partner);
      if (partner === "0x0000000000000000000000000000000000000000") {
        Lumino.callbacks.trigger(
          CALLBACKS.FAILED_DEPOSIT_CHANNEL,
          channel,
          "RNS domain isnt registered"
        );
      } else {
        params.partner = partner;
      }
    }
    const txParams = {
      ...params,
      amount,
      address: clientAddress,
    };
    const unsignedApprovalTx = await createApprovalTx(txParams);
    const unsignedDepositTx = await createDepositTx(txParams);
    const signed_approval_tx = await resolver(unsignedApprovalTx, lh);
    const signed_deposit_tx = await resolver(unsignedDepositTx, lh);

    const requestBody = {
      total_deposit: amount,
      signed_approval_tx,
      signed_deposit_tx,
      signed_close_tx: "",
    };
    const url = `light_channels/${tokenAddress}/${clientAddress}/${partner}`;
    Lumino.callbacks.trigger(CALLBACKS.REQUEST_DEPOSIT_CHANNEL, {
      ...channel,
      amount,
    });
    const res = await client.patch(url, { ...requestBody });
    dispatch({
      type: NEW_DEPOSIT,
      channel: { ...res.data, sdk_status: CHANNEL_OPENED },
    });
    const allData = getState();
    return await lh.storage.saveLuminoData(allData);
  } catch (error) {
    Lumino.callbacks.trigger(CALLBACKS.FAILED_DEPOSIT_CHANNEL, channel, error);
  }
};
