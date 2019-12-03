import {
  STORE_API_KEY,
  CHANGE_PAYMENT_POLLING_TIME,
  SET_CLIENT_ADDRESS,
  SET_LATEST_INTERNAL_MSG_ID,
} from "../actions/types";

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
    case SET_CLIENT_ADDRESS:
      const newAddress = { ...state, address: action.address };
      return newAddress;
    case SET_LATEST_INTERNAL_MSG_ID:
      const newMaxId = { ...state, internal_msg_id: action.id };
      return newMaxId;
    default:
      return state;
  }
};

export default clientReducer;
