export const saveLuminoData = () => async (dispatch, getState, lh) => {
  const luminoData = getState();
  return lh.storage.saveLuminoData(luminoData);
};
