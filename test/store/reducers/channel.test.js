import {
  ADD_CHANNEL_WAITING_FOR_OPENING,
  CLOSE_CHANNEL_VOTE,
  DELETE_CHANNEL_FROM_SDK,
  OPEN_CHANNEL_VOTE,
  SET_CHANNEL_AWAITING_CLOSE,
  SET_CHANNEL_SETTLED,
  SET_CHANNEL_UNLOCKED,
  SET_IS_SETTLING,
  SET_IS_UNLOCKING,
  UPDATE_NON_CLOSING_BP,
} from "../../../src/store/actions/types";
import reducer from "../../../src/store/reducers/channelReducer";
import {
  CHANNEL_CLOSED,
  CHANNEL_OPENED,
  CHANNEL_SETTLED,
  CHANNEL_UNLOCKED,
  CHANNEL_WAITING_FOR_CLOSE,
  CHANNEL_WAITING_OPENING,
} from "../../../src/config/channelStates";

const mockAddr = "0xFb783358Ff2b40630B112e3B937f0c43C1Ab2172";
const mockToken = "0x931A46774dFDC44aac1D6eCa15930b6c3895dD7a";

const initialState = {};

const getChannelKey = data => {
  return `${data.channel_identifier}-${data.token_address}`;
};

const getTemporaryKey = data => {
  return `T-${data.partner_address}-${data.token_address}`;
};

const getPaymentChannelKey = data => {
  const { channelId, token } = data;
  return `${channelId}-${token}`;
};

describe("Channel reducer", () => {
  it("should return initial state", () => {
    const red = reducer(undefined, {});
    expect(red).toEqual(initialState);
  });

  it("Should handle SET_CHANNEL_UNLOCKED", () => {
    const action = {
      type: SET_CHANNEL_UNLOCKED,
      data: {
        token_address: mockToken,
        partner_address: mockAddr,
        channel_identifier: 1,
      },
    };
    const channelKey = getChannelKey(action.data);
    const state = {
      [channelKey]: {
        balance: 500,
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      [channelKey]: {
        ...state[channelKey],
        sdk_status: CHANNEL_UNLOCKED,
        isUnlocked: true,
        isUnlocking: false,
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_IS_UNLOCKING", () => {
    const action = {
      type: SET_IS_UNLOCKING,
      data: {
        token_address: mockToken,
        channel_identifier: 1,
        isUnlocking: false,
      },
    };
    const channelKey = getChannelKey(action.data);
    const state = {
      [channelKey]: {
        balance: 500,
        isUnlocking: true,
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      [channelKey]: {
        ...state[channelKey],
        isUnlocking: false,
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_IS_SETTLING", () => {
    const action = {
      type: SET_IS_SETTLING,
      data: {
        token_address: mockToken,
        channel_identifier: 1,
        isSettling: false,
      },
    };
    const channelKey = getChannelKey(action.data);
    const state = {
      [channelKey]: {
        balance: 500,
        isSettling: true,
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      [channelKey]: {
        ...state[channelKey],
        isSettling: false,
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_CHANNEL_SETTLED", () => {
    const action = {
      type: SET_CHANNEL_SETTLED,
      data: {
        token_address: mockToken,
        partner_address: mockAddr,
        channel_identifier: 1,
      },
    };
    const channelKey = getChannelKey(action.data);
    const state = {
      [channelKey]: {
        balance: 500,
        isSettled: false,
        isSettling: true,
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      [channelKey]: {
        ...state[channelKey],
        sdk_status: CHANNEL_SETTLED,
        isSettled: true,
        isSettling: false,
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle ADD_CHANNEL_WAITING_FOR_OPENING", () => {
    const action = {
      type: ADD_CHANNEL_WAITING_FOR_OPENING,
      channel: {
        token_address: mockToken,
        partner_address: mockAddr,
      },
    };
    const channelKey = getTemporaryKey(action.channel);
    const state = {};
    const red = reducer(state, action);
    const expected = {
      ...state,
      [channelKey]: {
        ...state[channelKey],
        ...action.channel,
        sdk_status: CHANNEL_WAITING_OPENING,
        isTemporary: true,
        isOpening: true,
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle DELETE_CHANNEL_FROM_SDK", () => {
    const channel_identifier = 1;
    const token_address = mockToken;
    const action = {
      type: DELETE_CHANNEL_FROM_SDK,
      id: channel_identifier,
      token_address,
    };
    const channelKey = getChannelKey({ token_address, channel_identifier });
    const state = {
      [channelKey]: {
        sdk_status: CHANNEL_UNLOCKED,
      },
    };
    const red = reducer(state, action);
    const expected = {};
    expect(red).toEqual(expected);
  });

  it("Should handle UPDATE_NON_CLOSING_BP", () => {
    const channel_identifier = 1;
    const token_address = mockToken;
    const action = {
      type: UPDATE_NON_CLOSING_BP,
      channelId: channel_identifier,
      token: token_address,
      nonClosingBp: { secret: mockAddr },
    };
    const channelKey = getPaymentChannelKey(action);
    const state = {
      [channelKey]: {
        sdk_status: CHANNEL_OPENED,
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      [channelKey]: {
        ...state[channelKey],
        nonClosingBp: action.nonClosingBp,
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle OPEN_CHANNEL_VOTE", () => {
    const channel_identifier = 1;
    const token_address = mockToken;
    const notifier1 = "http://localhost:8080";
    const action = {
      type: OPEN_CHANNEL_VOTE,
      channel: {
        channel_identifier: channel_identifier,
        token_address: token_address,
      },
      shouldOpen: true,
      notifier: notifier1,
    };
    const channelKey = getChannelKey(action.channel);
    const state = {
      [channelKey]: {
        sdk_status: CHANNEL_OPENED,
        votes: { open: {} },
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      [channelKey]: {
        ...state[channelKey],
        canRemoveTemporalChannel: true,
        votes: { open: { [notifier1]: true } },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle OPEN_CHANNEL_VOTE with the channel not being created", () => {
    const channel_identifier = 1;
    const token_address = mockToken;
    const notifier1 = "http://localhost:8080";
    const action = {
      type: OPEN_CHANNEL_VOTE,
      channel: {
        channel_identifier: channel_identifier,
        token_address: token_address,
      },
      shouldOpen: true,
      notifier: notifier1,
    };
    const channelKey = getChannelKey(action.channel);
    const state = {};
    const red = reducer(state, action);
    const expected = {
      ...state,
      [channelKey]: {
        ...state[channelKey],
        canRemoveTemporalChannel: true,
        channel_identifier,
        hubAnswered: false,
        isSettled: false,
        isSettling: false,
        offChainBalance: "0",
        receivedTokens: "0",
        sdk_status: CHANNEL_OPENED,
        sentTokens: "0",
        token_address,
        votes: { open: { [notifier1]: true }, close: {} },
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle SET_CHANNEL_AWAITING_CLOSE", () => {
    const channel_identifier = 1;
    const token_address = mockToken;
    const action = {
      type: SET_CHANNEL_AWAITING_CLOSE,
      channel: {
        channel_identifier: channel_identifier,
        token_address: token_address,
      },
    };
    const channelKey = getChannelKey(action.channel);
    const state = {
      [channelKey]: {
        sdk_status: CHANNEL_OPENED,
        votes: { open: {} },
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      [channelKey]: {
        ...state[channelKey],
        sdk_status: CHANNEL_WAITING_FOR_CLOSE,
      },
    };
    expect(red).toEqual(expected);
  });

  it("Should handle CLOSE_CHANNEL_VOTE", () => {
    const channel_identifier = 1;
    const token_address = mockToken;
    const notifier1 = "http://localhost:8080";
    const action = {
      type: CLOSE_CHANNEL_VOTE,
      channel: {
        channel_identifier: channel_identifier,
        token_address: token_address,
      },
      shouldClose: true,
      notifier: notifier1,
    };
    const channelKey = getChannelKey(action.channel);
    const state = {
      [channelKey]: {
        sdk_status: CHANNEL_OPENED,
        votes: { open: {} },
      },
    };
    const red = reducer(state, action);
    const expected = {
      ...state,
      [channelKey]: {
        ...state[channelKey],
        sdk_status: CHANNEL_CLOSED,
        votes: { close: { [notifier1]: true }, open: {} },
      },
    };
    expect(red).toEqual(expected);
  });
});
