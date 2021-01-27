import {
  CREATE_PAYMENT,
  ADD_PENDING_PAYMENT_MESSAGE,
  DELETE_ALL_PENDING_PAYMENTS,
  SET_PAYMENT_SECRET,
  SET_PAYMENT_COMPLETE,
  SET_SECRET_MESSAGE_ID,
  SET_PAYMENT_FAILED,
  PUT_LOCK_EXPIRED,
  ADD_EXPIRED_PAYMENT_MESSAGE,
  STORE_REFUND_TRANSFER,
  ADD_REFUNDED_PAYMENT_MESSAGE,
  REGISTERED_ON_CHAIN_SECRET,
  REGISTERING_ON_CHAIN_SECRET,
} from "../actions/types";
import { PENDING_PAYMENT } from "../../config/paymentConstants";

const initialState = {
  pending: {},
  completed: {},
  failed: {},
};

const cloneState = state => ({
  pending: { ...state.pending },
  completed: { ...state.completed },
  failed: { ...state.failed },
});

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
      const paymentStateL = paymentState.toLowerCase();
      const newState = cloneState(state);
      newState.failed[paymentId] = state[paymentStateL][paymentId];
      newState.failed[paymentId].failureReason = reason;
      // Only remove payment from pending state
      // Refund => Expired states must not delete it
      if (paymentState === PENDING_PAYMENT)
        delete newState[paymentStateL][paymentId];
      return newState;
    }
    case STORE_REFUND_TRANSFER: {
      const { refundTransfer } = action;
      const newState = cloneState(state);
      newState.failed[paymentId].refund = {
        messages: { 1: refundTransfer },
        message_order: 1,
      };

      return newState;
    }
    case PUT_LOCK_EXPIRED: {
      const { lockExpired } = action;
      const newState = cloneState(state);
      newState.failed[paymentId].expiration = {
        messages: { 1: lockExpired },
        message_order: 1,
      };

      return newState;
    }

    case ADD_EXPIRED_PAYMENT_MESSAGE: {
      const { messageOrder, message, storeInMessages } = action;
      const newState = cloneState(state);
      if (storeInMessages) {
        if (!newState.failed[paymentId].messages)
          newState.failed[paymentId].messages = {};
        newState.failed[paymentId].messages[messageOrder] = message;
      } else {
        newState.failed[paymentId].expiration.messages[messageOrder] = message;
        newState.failed[paymentId].expiration.message_order = messageOrder;
      }
      return newState;
    }
    case ADD_REFUNDED_PAYMENT_MESSAGE: {
      const { messageOrder, message } = action;
      const newState = cloneState(state);
      if (!newState.failed[paymentId].refund) {
        newState.failed[paymentId].refund = {
          messages: {},
          message_order: 0,
        };
      }
      newState.failed[paymentId].refund.messages[messageOrder] = message;
      newState.failed[paymentId].refund.message_order = messageOrder;

      return newState;
    }
    case REGISTERING_ON_CHAIN_SECRET: {
      const newState = cloneState(state);
      const { registeringOnChainSecret } = action;
      newState.pending[
        paymentId
      ].registeringOnChainSecret = registeringOnChainSecret;
      return newState;
    }
    case REGISTERED_ON_CHAIN_SECRET: {
      const newState = cloneState(state);
      newState.pending[paymentId].registeringOnChainSecret = false;
      newState.pending[paymentId].registeredOnChainSecret = true;
      return newState;
    }
    default:
      return state;
  }
};

export default paymentsReducer;
