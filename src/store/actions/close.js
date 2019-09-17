import {SET_CHANNEL_CLOSED} from './types';
import client from '../../apiRest';
import resolver from '../../utils/handlerResolver';
import {CHANNEL_CLOSED} from '../../config/channelStates';

/**
 * Create a deposit.
 * @param {string} unsigned_tx- An unsigned close TX
 * @param {string} address -  The address of the creator of the channel
 * @param {string} partner -  The partner address
 * @param {string} token_address -  The address of the lumino token
 */
export const closeChannel = params => async (dispatch, getState, lh) => {
  try {
    const signed_close_tx = await resolver(params.unsigned_tx, lh);
    try {
      const {address, partner, token_address} = params;
      const requestBody = {
        signed_approval_tx: '',
        signed_close_tx,
        signed_deposit_tx: '',
        state: 'closed',
      };
      debugger;
      const url = `light_channels/${token_address}/${address}/${partner}`;
      debugger;

      const res = await client.patch(url, {...requestBody});
      debugger;

      dispatch({
        type: SET_CHANNEL_CLOSED,
        channel: {...res.data, sdk_state: CHANNEL_CLOSED},
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
