export const deploySmartWallet = (
  smartWalletAddress,
  smartWalletIndex,
  tokenAddress,
  tokenAmount
) => async (dispatch, getState, lh) => {
  return await lh.enveloping.deploySmartWallet(
    dispatch,
    getState,
    smartWalletAddress,
    smartWalletIndex,
    tokenAddress,
    tokenAmount
  );
};

export const relayTransaction = (
  smartWalletAddress,
  tokenAddress,
  tokenAmount,
  unsigned_tx
) => async (dispatch, getState, lh) => {
  return await lh.enveloping.relayTransaction(
    getState,
    smartWalletAddress,
    tokenAmount,
    tokenAddress,
    unsigned_tx
  );
};

export const generateSmartWalletAddress = smartWalletIndex => async (
  dispatch,
  getState,
  lh
) => {
  return await lh.enveloping.generateSmartWalletAddress(
    dispatch,
    getState,
    smartWalletIndex
  );
};

export const getSmartWallets = () => async (dispatch, getState, lh) => {
  return lh.enveloping.getWallets(getState);
};

export const getSmartWallet = smartWalletAddress => async (
  dispatch,
  getState,
  lh
) => {
  return lh.enveloping.getWallet(getState, smartWalletAddress);
};

export const storeSmartWallet = wallet => async (dispatch, getState, lh) => {
  return lh.enveloping.storeWallet(dispatch, wallet);
};
