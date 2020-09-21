import {
  ADD_CHANNEL_WAITING_FOR_OPENING,
  DELETE_CHANNEL_FROM_SDK,
  SET_CHANNEL_SETTLED,
  SET_CHANNEL_UNLOCKED,
  SET_IS_SETTLING,
  SET_IS_UNLOCKING,
  UPDATE_NON_CLOSING_BP,
} from "../../../src/store/actions/types";
import reducer from "../../../src/store/reducers/channelReducer";
import {
  CHANNEL_OPENED,
  CHANNEL_SETTLED,
  CHANNEL_UNLOCKED,
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
});
