import { NEW_DEPOSIT } from "./types";
import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";

export const createDeposit = params => async (dispatch, getState, lh) => {
  try {
    const signed_approval_tx = await resolver(params.unsigned_approval_tx, lh);
    const signed_deposit_tx = await resolver(params.unsigned_deposit_tx, lh);
    try {
      const { total_deposit, address, partner, token_address } = params;
      const requestBody = {
        total_deposit,
        signed_approval_tx,
        signed_deposit_tx
      };
      const url = `light_channels/${token_address}/${address}/${partner}`;
      const res = await client.patch(url, { ...requestBody });
      dispatch({
        type: NEW_DEPOSIT,
        channel: { ...res.data }
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
