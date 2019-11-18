import { CREATE_PAYMENT, DELETE_ALL_PENDING_PAYMENTS } from "../actions/types";
import { PENDING_PAYMENT } from "../../config/paymentConstants";

const initialState = {};

const paymentIdsReducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_PAYMENT:
      const newPayment = { ...state, [action.paymentId]: PENDING_PAYMENT };
      return newPayment;
    case DELETE_ALL_PENDING_PAYMENTS:
      return {};
    default:
      return state;
  }
};

export default paymentIdsReducer;
