import {
  FAILURE_REASONS,
  PENDING_PAYMENT,
} from "../../../src/config/paymentConstants";
import {
  ADD_EXPIRED_PAYMENT_MESSAGE,
  ADD_PENDING_PAYMENT_MESSAGE,
  ADD_REFUNDED_PAYMENT_MESSAGE,
  CREATE_PAYMENT,
  DELETE_ALL_PENDING_PAYMENTS,
  PUT_LOCK_EXPIRED,
  REGISTERED_ON_CHAIN_SECRET,
  REGISTERING_ON_CHAIN_SECRET,
  SET_PAYMENT_COMPLETE,
  SET_PAYMENT_FAILED,
  SET_PAYMENT_SECRET,
  SET_SECRET_MESSAGE_ID,
  STORE_REFUND_TRANSFER,
} from "../../../src/store/actions/types";
import reducer from "../../../src/store/reducers/paymentsReducer";

const mockToken = "0x931A46774dFDC44aac1D6eCa15930b6c3895dD7a";

const initialState = {
  pending: {},
  completed: {},
  failed: {},
};

describe("Client reducer", () => {
  it("should return initial state", () => {
    const red = reducer(undefined, {});
    expect(red).toEqual(initialState);
  });

  it("Should handle CREATE_PAYMENT", () => {
    const secret = "0x123456";
    const token = mockToken;
    const paymentId = "12345";
    const action = {
      type: CREATE_PAYMENT,
      paymentId,
      secret,
      payment: {
        secret,
        token,
      },
    };
    const red = reducer(initialState, action);
    const expected = {
      ...initialState,
      pending: {
        [paymentId]: {
          secret,
          token,
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_PAYMENT_FAILED", () => {
    const secret = "0x123456";
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      pending: {
        [paymentId]: {
          secret,
          token,
        },
      },
    };
    const action = {
      type: SET_PAYMENT_FAILED,
      paymentId,
      secret,
      reason: FAILURE_REASONS.EXPIRED,
      paymentState: PENDING_PAYMENT,
      payment: {
        secret,
        token,
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...initialState,
      pending: {},
      failed: {
        [paymentId]: {
          secret,
          failureReason: FAILURE_REASONS.EXPIRED,
          token,
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle ADD_PENDING_PAYMENT_MESSAGE", () => {
    const secret = "0x123456";
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      pending: {
        [paymentId]: {
          secret,
          token,
          messages: {},
        },
      },
    };
    const action = {
      type: ADD_PENDING_PAYMENT_MESSAGE,
      paymentId,
      secret,
      messageOrder: 1,
      message: {
        data: "dataExample",
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      pending: {
        [paymentId]: {
          ...state.pending[paymentId],
          message_order: action.messageOrder,
          messages: {
            ...state.pending[paymentId].messages,
            [action.messageOrder]: {
              ...action.message,
            },
          },
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle ADD_EXPIRED_PAYMENT_MESSAGE", () => {
    const secret = "0x123456";
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      completed: {},
      pending: {},
      failed: {
        [paymentId]: {
          secret,
          token,
          messages: {},
          expiration: {
            messages: {},
          },
        },
      },
    };
    const action = {
      type: ADD_EXPIRED_PAYMENT_MESSAGE,
      paymentId,
      secret,
      messageOrder: 1,
      message: {
        data: "dataExample",
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      failed: {
        [paymentId]: {
          ...state.failed[paymentId],
          messages: {},
          expiration: {
            ...state.failed[paymentId].expiration,
            messages: {
              ...state.failed[paymentId].expiration.messages,
              [action.messageOrder]: {
                ...action.message,
              },
            },
          },
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle ADD_EXPIRED_PAYMENT_MESSAGE when storing in normal messages", () => {
    const secret = "0x123456";
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      completed: {},
      pending: {},
      failed: {
        [paymentId]: {
          secret,
          token,
          messages: {},
          expiration: {
            messages: {},
          },
        },
      },
    };
    const action = {
      type: ADD_EXPIRED_PAYMENT_MESSAGE,
      paymentId,
      secret,
      messageOrder: 12,
      message: {
        data: "dataExample",
      },
      storeInMessages: true,
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      failed: {
        [paymentId]: {
          ...state.failed[paymentId],
          messages: {
            ...state.failed[paymentId].messages,
            [action.messageOrder]: {
              ...action.message,
            },
          },
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle ADD_REFUNDED_PAYMENT_MESSAGE", () => {
    const secret = "0x123456";
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      completed: {},
      pending: {},
      failed: {
        [paymentId]: {
          secret,
          token,
          messages: {},
          refund: {
            messages: {},
          },
        },
      },
    };
    const action = {
      type: ADD_REFUNDED_PAYMENT_MESSAGE,
      paymentId,
      secret,
      messageOrder: 1,
      message: {
        data: "dataExample",
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      failed: {
        [paymentId]: {
          ...state.failed[paymentId],
          messages: {},
          refund: {
            ...state.failed[paymentId].refund,
            messages: {
              ...state.failed[paymentId].refund.messages,
              [action.messageOrder]: {
                ...action.message,
              },
            },
          },
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_PAYMENT_SECRET", () => {
    const secret = "0x123456";
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      pending: {
        [paymentId]: {
          token,
          messages: {},
        },
      },
    };
    const action = {
      type: SET_PAYMENT_SECRET,
      paymentId,
      secret,
      messageOrder: 1,
      message: {
        data: "dataExample",
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      pending: {
        [paymentId]: {
          ...state.pending[paymentId],
          secret,
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle REGISTERING_ON_CHAIN_SECRET", () => {
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      failed: {},
      completed: {},
      pending: {
        [paymentId]: {
          token,
          messages: {},
        },
      },
    };
    const action = {
      type: REGISTERING_ON_CHAIN_SECRET,
      paymentId,
      registeringOnChainSecret: true,
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      pending: {
        [paymentId]: {
          ...state.pending[paymentId],
          registeringOnChainSecret: action.registeringOnChainSecret,
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle REGISTERED_ON_CHAIN_SECRET", () => {
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      failed: {},
      completed: {},
      pending: {
        [paymentId]: {
          token,
          messages: {},
        },
      },
    };
    const action = {
      type: REGISTERED_ON_CHAIN_SECRET,
      paymentId,
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      pending: {
        [paymentId]: {
          ...state.pending[paymentId],
          registeringOnChainSecret: false,
          registeredOnChainSecret: true,
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_PAYMENT_COMPLETE", () => {
    const secret = "0x123456";
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      pending: {
        [paymentId]: {
          token,
          messages: {},
        },
      },
    };
    const action = {
      type: SET_PAYMENT_COMPLETE,
      paymentId,
      secret,
      messageOrder: 1,
      message: {
        data: "dataExample",
      },
    };
    const red = reducer(state, action);
    const expected = {
      completed: {
        [paymentId]: {
          token,
          messages: {},
        },
      },
      pending: {},
    };
    expect(red).toEqual(expected);
  });

  it("Should handle DELETE_ALL_PENDING_PAYMENTS", () => {
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      failed: {},
      completed: { test: "Something" },
      pending: {
        [paymentId]: {
          token,
          messages: {},
        },
      },
    };
    const action = {
      type: DELETE_ALL_PENDING_PAYMENTS,
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      pending: {},
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_SECRET_MESSAGE_ID", () => {
    const secret = "0x123456";
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      pending: {
        [paymentId]: {
          token,
          messages: {},
        },
      },
    };
    const action = {
      type: SET_SECRET_MESSAGE_ID,
      paymentId,
      secret,
      id: 1,
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      pending: {
        ...state.pending,
        [paymentId]: {
          ...state.pending[paymentId],
          secretMessageId: action.id,
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle STORE_REFUND_TRANSFER", () => {
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      completed: {},
      pending: {},
      failed: {
        [paymentId]: {
          token,
          messages: {},
        },
      },
    };
    const action = {
      type: STORE_REFUND_TRANSFER,
      paymentId,
      refundTransfer: { test: "Test" },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      failed: {
        ...state.failed,
        [paymentId]: {
          ...state.failed[paymentId],
          refund: {
            messages: { 1: action.refundTransfer },
            message_order: 1,
          },
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle PUT_LOCK_EXPIRED", () => {
    const token = mockToken;
    const paymentId = "12345";
    const state = {
      completed: {},
      pending: {},
      failed: {
        [paymentId]: {
          token,
          messages: {},
        },
      },
    };
    const action = {
      type: PUT_LOCK_EXPIRED,
      paymentId,
      lockExpired: { test: "Test" },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      failed: {
        ...state.failed,
        [paymentId]: {
          ...state.failed[paymentId],
          expiration: {
            messages: { 1: action.lockExpired },
            message_order: 1,
          },
        },
      },
    };
    expect(red).toEqual(expected);
  });
});
