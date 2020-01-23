import { ADD_NEW_TOKEN } from "../actions/types";

const initialState = {};

const tokensNetworkReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_NEW_TOKEN:
      const newToken = { ...state, [action.tokenNetwork]: action.tokenAddress };
      return newToken;
    default:
      return state;
  }
};

export default tokensNetworkReducer;
