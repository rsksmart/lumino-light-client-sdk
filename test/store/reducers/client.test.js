import {
  STORE_API_KEY,
  CHANGE_PAYMENT_POLLING_TIME,
  SET_LATEST_INTERNAL_MSG_ID,
  SET_LAST_NOTIFICATION_ID,
} from "../../../src/store/actions/types";
import reducer from "../../../src/store/reducers/clientReducer";

const mockApiKey = "AbCdER90123";

const initialState = {
  apiKey: "",
  address: "",
  paymentPollingTime: 10000,
};

describe("Client reducer", () => {
  it("should return initial state", () => {
    const red = reducer(undefined, {});
    expect(red).toEqual(initialState);
  });

  it("Should handle STORE_API_KEY", () => {
    const action = {
      type: STORE_API_KEY,
      apiKey: mockApiKey,
    };
    const red = reducer(undefined, action);
    const expected = {
      ...initialState,
      apiKey: mockApiKey,
    };
    expect(red).toEqual(expected);
  });

  it("Should handle CHANGE_PAYMENT_POLLING_TIME", () => {
    const action = {
      type: CHANGE_PAYMENT_POLLING_TIME,
      time: 500,
    };
    const red = reducer(undefined, action);
    const expected = {
      ...initialState,
      paymentPollingTime: 500,
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_LATEST_INTERNAL_MSG_ID", () => {
    const action = {
      type: SET_LATEST_INTERNAL_MSG_ID,
      id: 404,
    };
    const red = reducer(undefined, action);
    const expected = {
      ...initialState,
      internal_msg_id: 404,
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_LAST_NOTIFICATION_ID", () => {
    const action = {
      type: SET_LAST_NOTIFICATION_ID,
      id: 405,
    };
    const red = reducer(undefined, action);
    const expected = {
      ...initialState,
      lastNotificationId: 405,
    };
    expect(red).toEqual(expected);
  });
});
