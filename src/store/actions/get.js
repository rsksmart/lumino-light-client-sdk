/**
 * Returns all lumino channels
 * @returns {Array<object>} All the lumino channels
 */
export const getChannels = () => (dispatch, getState) =>
  getState().channelReducer;
