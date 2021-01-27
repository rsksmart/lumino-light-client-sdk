import { SDK_CHANNEL_STATUS } from "../../config/channelStates";

/**
 * Returns all lumino channels
 * @returns {Array<object>} All the opened channels
 */
export const getChannels = () => (dispatch, getState) => {
  const channels = getState().channelReducer;
  const validChannels = {};
  Object.entries(channels).forEach(([k, ch]) => {
    if (ch.sdk_status !== SDK_CHANNEL_STATUS.CHANNEL_AWAITING_NOTIFICATION)
      validChannels[k] = ch;
  });
  return validChannels;
};
