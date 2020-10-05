import {
  NEW_NOTIFIER,
  REMOVE_NOTIFIER,
  SET_LAST_NOTIFICATION_ID,
  SUBSCRIBED_TO_NEW_TOPIC,
} from "../../../src/store/actions/types";
import reducer from "../../../src/store/reducers/notifierReducer";

const mockApiKey = "abc123";
const mockUrl1 = "http://localhost:8080";

const initialState = {
  notifiers: {},
};

describe("Client reducer", () => {
  it("should return initial state", () => {
    const red = reducer(undefined, {});
    expect(red).toEqual(initialState);
  });

  it("should manage NEW_NOTIFIER", () => {
    const action = {
      type: NEW_NOTIFIER,
      notifierUrl: mockUrl1,
      notifierApiKey: mockApiKey,
    };
    const red = reducer(initialState, action);
    const expected = {
      notifiers: {
        [mockUrl1]: {
          fromNotificationId: 0,
          apiKey: action.notifierApiKey,
          topics: {},
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("should manage NEW_NOTIFIER and merge the new api key if already exists", () => {
    const apiKey2 = "CBDA234";
    const state = {
      notifiers: {
        [mockUrl1]: {
          fromNotificationId: 0,
          apiKey: apiKey2,
          topics: { 69: 69, 7283: 7283 },
        },
      },
    };
    const action = {
      type: NEW_NOTIFIER,
      notifierUrl: mockUrl1,
      notifierApiKey: mockApiKey,
    };
    const red = reducer(state, action);
    const expected = {
      notifiers: {
        ...state.notifiers,
        [mockUrl1]: {
          ...state.notifiers[mockUrl1],
          apiKey: action.notifierApiKey,
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("should manage SET_LAST_NOTIFICATION_ID", () => {
    const state = {
      notifiers: {
        [mockUrl1]: {
          fromNotificationId: 0,
          apiKey: mockApiKey,
          topics: {},
        },
      },
    };
    const action = {
      type: SET_LAST_NOTIFICATION_ID,
      ids: { [mockUrl1]: 24 },
    };
    const red = reducer(state, action);
    const expected = {
      notifiers: {
        [mockUrl1]: {
          ...state.notifiers[mockUrl1],
          fromNotificationId: action.ids[mockUrl1],
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("should manage SUBSCRIBED_TO_NEW_TOPIC", () => {
    const state = {
      notifiers: {
        [mockUrl1]: {
          fromNotificationId: 0,
          apiKey: mockApiKey,
          topics: {},
        },
      },
    };
    const action = {
      type: SUBSCRIBED_TO_NEW_TOPIC,
      notifierUrl: mockUrl1,
      topicId: 98,
    };
    const red = reducer(state, action);
    const expected = {
      notifiers: {
        [mockUrl1]: {
          ...state.notifiers[mockUrl1],
          topics: {
            ...state.notifiers[mockUrl1].topics,
            [action.topicId]: String(action.topicId),
          },
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("should manage SUBSCRIBED_TO_NEW_TOPIC and merge topics", () => {
    const state = {
      notifiers: {
        [mockUrl1]: {
          fromNotificationId: 0,
          apiKey: mockApiKey,
          topics: { 230: 230, 560: 560 },
        },
      },
    };
    const action = {
      type: SUBSCRIBED_TO_NEW_TOPIC,
      notifierUrl: mockUrl1,
      topicId: 98,
    };
    const red = reducer(state, action);
    const expected = {
      notifiers: {
        [mockUrl1]: {
          ...state.notifiers[mockUrl1],
          topics: {
            ...state.notifiers[mockUrl1].topics,
            [action.topicId]: String(action.topicId),
          },
        },
      },
    };
    expect(red).toEqual(expected);
  });

  it("should manage REMOVE_NOTIFIER", () => {
    const state = {
      notifiers: {
        [mockUrl1]: {
          fromNotificationId: 0,
          apiKey: mockApiKey,
          topics: {},
        },
      },
    };
    const action = {
      type: REMOVE_NOTIFIER,
      url: mockUrl1,
    };
    const red = reducer(state, action);
    const expected = {
      notifiers: {},
    };
    expect(red).toEqual(expected);
  });
});
