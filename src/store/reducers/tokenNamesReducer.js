import { ADD_NEW_TOKEN_NAME_SYMBOL } from "../actions/types";

const initialState = {};

const tokenNamesReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_NEW_TOKEN_NAME_SYMBOL:
      const { token_name, token_symbol, token_address } = action;
      const newToken = {
        ...state,
        [token_address]: {
          token_name,
          token_symbol,
        },
      };
      return newToken;
    default:
      return state;
  }
};

export default tokenNamesReducer;
