import { CHANNEL_OPENED } from "../../../src/config/channelStates";
import { OPEN_CHANNEL } from "../../../src/store/actions/types";
import reducer from "../../../src/store/reducers/channelStatesReducer";

const mockAddr = "0xFb783358Ff2b40630B112e3B937f0c43C1Ab2172";

const initialState = {};

describe("Client reducer", () => {
  it("should return initial state", () => {
    const red = reducer(undefined, {});
    expect(red).toEqual(initialState);
  });

  it("Should handle OPEN_CHANNEL", () => {
    const channel_identifier = 1;
    const token_address = mockAddr;
    const action = {
      type: OPEN_CHANNEL,
      channel: {
        channel_identifier,
        token_address,
      },
    };
    const red = reducer(initialState, action);
    const channelKey = `${channel_identifier}-${token_address}`;
    const expected = {
      ...initialState,
      [channelKey]: CHANNEL_OPENED,
    };
    expect(red).toEqual(expected);
  });
});
