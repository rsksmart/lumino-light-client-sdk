import {
  CREATE_PAYMENT,
  ADD_PENDING_PAYMENT_MESSAGE,
  DELETE_ALL_PENDING_PAYMENTS,
  SET_PAYMENT_SECRET,
} from "../actions/types";

const initialState = {
  pending: {},
  completed: {},
  failed: {},
};

const paymentsReducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_PAYMENT:
      const newPayment = {
        ...state,
        pending: {
          ...state.pending,
          [action.paymentId]: {
            secret: action.secret,
            ...action.payment,
          },
        },
      };
      return newPayment;
    case ADD_PENDING_PAYMENT_MESSAGE:
      const addedPaymentMessage = {
        ...state,
        pending: {
          ...state.pending,
          [action.paymentId]: {
            ...state.pending[action.paymentId],
            message_order: action.messageOrder,
            messages: {
              ...state.pending[action.paymentId].messages,
              [action.messageOrder]: action.message,
            },
          },
        },
      };
      return addedPaymentMessage;
    case SET_PAYMENT_SECRET:
      const paymentWithSecret = {
        ...state,
        pending: {
          ...state.pending,
          [action.paymentId]: {
            ...state.pending[action.paymentId],
            secret: action.secret,
          },
        },
      };
      return paymentWithSecret;
    case DELETE_ALL_PENDING_PAYMENTS:
      return { ...state, pending: {} };
    default:
      return state;
  }
};

export default paymentsReducer;
