import { STORE_API_KEY } from "../actions/types";

const initialState = {
  apiKey: "",
  address: "",
};

const clientReducer = (state = initialState, action) => {
  switch (action.type) {
    case STORE_API_KEY:
      const newApiKey = { ...state, apiKey: action.apiKey };
      return newApiKey;
    default:
      return state;
  }
};

export default clientReducer;
