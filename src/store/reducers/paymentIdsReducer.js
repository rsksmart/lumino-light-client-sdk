import {
  CREATE_PAYMENT,
  DELETE_ALL_PENDING_PAYMENTS,
  SET_PAYMENT_COMPLETE,
} from "../actions/types";
import {
  PENDING_PAYMENT,
  COMPLETED_PAYMENT,
} from "../../config/paymentConstants";

const initialState = {};

const paymentIdsReducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_PAYMENT:
      const newPayment = { ...state, [action.paymentId]: PENDING_PAYMENT };
      return newPayment;
    case DELETE_ALL_PENDING_PAYMENTS:
      return {};
    case SET_PAYMENT_COMPLETE:
      const completed = { ...state, [action.paymentId]: COMPLETED_PAYMENT };
      return completed;
    default:
      return state;
  }
};

export default paymentIdsReducer;
