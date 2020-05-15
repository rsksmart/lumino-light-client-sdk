import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import { getChannels } from "../../../src/store/actions/get";
import { CHANNEL_OPENED } from "../../../src/config/channelStates";

// Mock store
const lh = {
  storage: { saveLuminoData: jest.fn() },
};

const middlewares = [thunk.withExtraArgument(lh)];
const mockStore = configureMockStore(middlewares);

describe("test get channel actions", () => {
  test("should get all non notified channels", async () => {
    const state = {
      channelReducer: {
        "1-0x3": { sdk_status: CHANNEL_OPENED },
        "2-0x3": { sdk_status: CHANNEL_OPENED },
        "3-0x3": { sdk_status: CHANNEL_OPENED },
      },
    };
    const store = mockStore(state);

    const channels = store.dispatch(getChannels());
    expect(channels).toStrictEqual(state.channelReducer);
  });
});
