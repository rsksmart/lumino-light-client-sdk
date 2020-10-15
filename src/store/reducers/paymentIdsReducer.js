import {
  CREATE_PAYMENT,
  DELETE_ALL_PENDING_PAYMENTS,
  SET_PAYMENT_COMPLETE,
  SET_PAYMENT_FAILED,
} from "../actions/types";
import {
  PENDING_PAYMENT,
  COMPLETED_PAYMENT,
  FAILED_PAYMENT,
} from "../../config/paymentConstants";

const initialState = {};

const paymentIdsReducer = (state = initialState, action) => {
  const { paymentId } = action;
  switch (action.type) {
    case CREATE_PAYMENT: {
      const newPayment = { ...state, [paymentId]: PENDING_PAYMENT };
      return newPayment;
    }
    case DELETE_ALL_PENDING_PAYMENTS: {
      const newState = { ...state };
      Object.keys(state).forEach(p => {
        if (state[p] === PENDING_PAYMENT) delete newState[p];
      });
      return newState;
    }
    case SET_PAYMENT_COMPLETE: {
      const completed = { ...state, [paymentId]: COMPLETED_PAYMENT };
      return completed;
    }
    case SET_PAYMENT_FAILED: {
      const newState = { ...state };
      newState[paymentId] = FAILED_PAYMENT;
      return newState;
    }
    default:
      return state;
  }
};

export default paymentIdsReducer;
