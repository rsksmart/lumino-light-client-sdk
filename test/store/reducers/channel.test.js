import {
  SET_CHANNEL_SETTLED,
  SET_CHANNEL_UNLOCKED,
  SET_IS_SETTLING,
  SET_IS_UNLOCKING,
} from "../../../src/store/actions/types";
import reducer from "../../../src/store/reducers/channelReducer";
import {
  CHANNEL_SETTLED,
  CHANNEL_UNLOCKED,
} from "../../../src/config/channelStates";

const mockAddr = "0xFb783358Ff2b40630B112e3B937f0c43C1Ab2172";
const mockToken = "0x931A46774dFDC44aac1D6eCa15930b6c3895dD7a";

const initialState = {};

const getChannelKey = action => {
  return `${action.data.channel_identifier}-${action.data.token_address}`;
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
    const channelKey = getChannelKey(action);
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
    const channelKey = getChannelKey(action);
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
    const channelKey = getChannelKey(action);
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
    const channelKey = getChannelKey(action);
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

});
