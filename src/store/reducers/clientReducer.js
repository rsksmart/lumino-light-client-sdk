import { STORE_API_KEY, STORE_ADDRESS } from "../actions/types";

const initialState = {
  apiKey: "",
  address: "",
};

const clientReducer = (state = initialState, action) => {
  switch (action.type) {
    case STORE_API_KEY:
      const newApiKey = { ...state, apiKey: action.apiKey };
      return newApiKey;
    case STORE_ADDRESS:
      const address = { ...state, address: action.address };
      return address;
    default:
      return state;
  }
};

export default clientReducer;
