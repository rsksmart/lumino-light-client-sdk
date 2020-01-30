import {
  CREATE_PAYMENT,
  ADD_PENDING_PAYMENT_MESSAGE,
  DELETE_ALL_PENDING_PAYMENTS,
  SET_PAYMENT_SECRET,
  SET_PAYMENT_COMPLETE,
  SET_SECRET_MESSAGE_ID,
  SET_PAYMENT_FAILED,
  PUT_LOCK_EXPIRED,
} from "../actions/types";

const initialState = {
  pending: {},
  completed: {},
  failed: {},
};

const paymentsReducer = (state = initialState, action) => {
  const { paymentId } = action;
  switch (action.type) {
    case CREATE_PAYMENT: {
      const newPayment = {
        ...state,
        pending: {
          ...state.pending,
          [paymentId]: {
            secret: action.secret,
            ...action.payment,
          },
        },
      };
      return newPayment;
    }
    case ADD_PENDING_PAYMENT_MESSAGE: {
      const addedPaymentMessage = {
        ...state,
        pending: {
          ...state.pending,
          [action.paymentId]: {
            ...state.pending[paymentId],
            message_order: action.messageOrder,
            messages: {
              ...state.pending[paymentId].messages,
              [action.messageOrder]: action.message,
            },
          },
        },
      };
      return addedPaymentMessage;
    }
    case SET_PAYMENT_SECRET: {
      const paymentWithSecret = {
        ...state,
        pending: {
          ...state.pending,
          [action.paymentId]: {
            ...state.pending[paymentId],
            secret: action.secret,
          },
        },
      };
      return paymentWithSecret;
    }
    case SET_PAYMENT_COMPLETE: {
      const newComplete = {
        ...state,
        completed: {
          ...state.completed,
          [action.paymentId]: {
            ...state.pending[paymentId],
          },
        },
      };
      delete newComplete.pending[paymentId];
      return newComplete;
    }
    case DELETE_ALL_PENDING_PAYMENTS:
      return { ...state, pending: {} };
    case SET_SECRET_MESSAGE_ID: {
      const secretId = {
        ...state,
        pending: {
          ...state.pending,
          [action.paymentId]: {
            ...state.pending[paymentId],
            secretMessageId: action.id,
          },
        },
      };
      return secretId;
    }
    case SET_PAYMENT_FAILED: {
      const { reason, paymentState } = action;
      const newState = {
        pending: { ...state.pending },
        completed: { ...state.completed },
        failed: { ...state.failed },
      };
      newState.failed[paymentId] = state[paymentState.toLowerCase()][paymentId];
      newState.failed[paymentId].failureReason = reason;
      delete newState[paymentState.toLowerCase()][paymentId];
      return newState;
    }
    case PUT_LOCK_EXPIRED: {
      const { lockExpired } = action;
      const newState = { ...state };
      newState.failed[paymentId].expiration = {
        messages: { 1: lockExpired },
        message_order: 1,
      };

      return newState;
    }
    default:
      return state;
  }
};

export default paymentsReducer;
