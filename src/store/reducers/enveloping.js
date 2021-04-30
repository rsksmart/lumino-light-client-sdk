import { STORE_WALLET } from "../actions/types";

const initialState = {
  wallets: {}
};

const envelopingReducer = (state = initialState, action) => {
  switch (action.type) {
    case STORE_WALLET: {
      if (!state.wallets) {
        state.wallets = {};
      }
      state.wallets[action.wallet.address] = action.wallet;
      return state;
    }
    default:
      return state;
  }
};

export default envelopingReducer;
