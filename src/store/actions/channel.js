import {OPEN_CHANNEL} from './types';
import {CHANNEL_OPENED} from '../../config/channelStates';
import client from '../../apiRest';
import resolver from '../../utils/handlerResolver';

export const getChannels = () => (dispatch, getState) =>
  getState().channelReducer;

export const openChannel = params => async (dispatch, getState, lh) => {
  try {
    const signed_tx = await resolver(params.unsigned_tx, lh);
    try {
      const {partner_address, creator_address, token_address} = params;
      const requestBody = {
        partner_address,
        creator_address,
        token_address,
        signed_tx,
      };
      const res = await client.put('light_channels', {...requestBody});
      dispatch({
        type: OPEN_CHANNEL,
        channel: {...res.data, sdk_status: CHANNEL_OPENED},
      });
      const allData = getState();
      await lh.storage.saveLuminoData(allData);
    } catch (apiError) {
      throw apiError;
    }
  } catch (resolverError) {
    throw resolverError;
  }
};
