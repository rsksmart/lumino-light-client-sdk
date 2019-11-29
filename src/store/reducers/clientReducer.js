import { STORE_API_KEY, CHANGE_PAYMENT_POLLING_TIME } from "../actions/types";

const initialState = {
  apiKey: "",
  address: "",
  paymentPollingTime: 10000,
};

const clientReducer = (state = initialState, action) => {
  switch (action.type) {
    case STORE_API_KEY:
      const newApiKey = { ...state, apiKey: action.apiKey };
      return newApiKey;
    case CHANGE_PAYMENT_POLLING_TIME:
      const newTime = { ...state, paymentPollingTime: action.time };
      return newTime;
    default:
      return state;
  }
};

export default clientReducer;
