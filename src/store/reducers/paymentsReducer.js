import { CREATE_PAYMENT, ADD_PAYMENT_MESSAGE } from "../actions/types";

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
        pending: { ...state.pending, [action.paymentId]: action.payment },
      };
      return newPayment;
    case ADD_PAYMENT_MESSAGE:
      const addedPaymentMessage = {
        ...state,
        pending: {
          ...state.pending,
          [action.paymentId]: {
            ...state.pending[action.paymentId],
            messages: {
              ...state.pending[action.paymentId].messages,
              [action.messageOrder]: action.message,
            },
          },
        },
      };
      return addedPaymentMessage;
    default:
      return state;
  }
};

export default paymentsReducer;
