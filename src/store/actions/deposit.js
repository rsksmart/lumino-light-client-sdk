import {NEW_DEPOSIT} from './types';
import {CHANNEL_OPENED} from '../../config/channelStates';
import client from '../../apiRest';
import resolver from '../../utils/handlerResolver';

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
    const signed_approval_tx = await resolver(params.unsigned_approval_tx, lh);
    const signed_deposit_tx = await resolver(params.unsigned_deposit_tx, lh);
    try {
      const {total_deposit, address, partner, token_address} = params;
      const requestBody = {
        total_deposit,
        signed_approval_tx,
        signed_deposit_tx,
        signed_close_tx: '',
      };
      const url = `light_channels/${token_address}/${address}/${partner}`;
      const res = await client.patch(url, {...requestBody});
      dispatch({
        type: NEW_DEPOSIT,
        channel: {...res.data, sdk_status: CHANNEL_OPENED},
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
