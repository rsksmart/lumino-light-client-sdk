import {
  DELETE_ALL_PENDING_PAYMENTS,
  SET_PAYMENT_COMPLETE,
  CREATE_PAYMENT,
  SET_PAYMENT_FAILED,
} from "../../../src/store/actions/types";
import reducer from "../../../src/store/reducers/paymentIdsReducer";

const mockId1 = "1";
const mockId2 = "12";
const mockId3 = "123";
const mockId4 = "1234";

describe("Client reducer", () => {
  it("should return initial state", () => {
    const red = reducer({}, {});
    expect(red).toEqual({});
  });

  it("Should handle CREATE_PAYMENT", () => {
    const action = {
      type: CREATE_PAYMENT,
      paymentId: mockId1,
    };
    const red = reducer({}, action);
    const expected = {
      [mockId1]: "PENDING",
    };
    expect(red).toEqual(expected);
  });

  it("Should handle DELETE_ALL_PENDING_PAYMENTS", () => {
    const action = {
      type: DELETE_ALL_PENDING_PAYMENTS,
    };
    const mockInitialState = {
      [mockId1]: "PENDING",
      [mockId2]: "COMPLETED",
      [mockId3]: "COMPLETED",
      [mockId4]: "PENDING",
    };
    const red = reducer(mockInitialState, action);
    const expected = {
      [mockId2]: "COMPLETED",
      [mockId3]: "COMPLETED",
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_PAYMENT_COMPLETE", () => {
    const action = {
      type: SET_PAYMENT_COMPLETE,
      paymentId: mockId1,
    };
    const mockInitialState = {
      [mockId1]: "PENDING",
      [mockId2]: "PENDING",
    };
    const red = reducer(mockInitialState, action);
    const expected = {
      ...mockInitialState,
      [mockId1]: "COMPLETED",
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_PAYMENT_FAILED", () => {
    const action = {
      type: SET_PAYMENT_FAILED,
      paymentId: mockId1,
    };
    const mockInitialState = {
      [mockId1]: "PENDING",
      [mockId2]: "PENDING",
    };
    const red = reducer(mockInitialState, action);
    const expected = {
      ...mockInitialState,
      [mockId1]: "FAILED",
    };
    expect(red).toEqual(expected);
  });
});
