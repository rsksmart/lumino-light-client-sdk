import * as channelFunctions from "../../../src/store/functions/channels";
import Store from "../../../src/store";
import { LocalStorageHandler } from "../../../src";
import {
  CHANNEL_OPENED,
  CHANNEL_CLOSED,
} from "../../../src/config/channelStates";

describe("Operation with store and channels", () => {
  afterEach(() => {
    Store.destroyStore();
  });

  const initStoreWithData = async data => {
    LocalStorageHandler.saveLuminoData(data);
    await Store.initStore(LocalStorageHandler, {});
  };

  test("should return all channels keys and state", async () => {
    const state = {
      channelStates: {
        "1-Ox123": CHANNEL_OPENED,
        "2-0x321": CHANNEL_CLOSED,
      },
    };
    await initStoreWithData(state);
    const states = channelFunctions.getChannelsState();
    expect(states).toStrictEqual(state.channelStates);
  });

  test("should return a channel by id and token", async () => {
    const state = {
      channelStates: {
        "1-Ox123": CHANNEL_OPENED,
        "2-0x321": CHANNEL_CLOSED,
      },
      channelReducer: {
        "1-0x123": {},
        "2-0x321": {},
      },
    };
    await initStoreWithData(state);
    const channel = channelFunctions.getChannelByIdAndToken(1, "0x123");
    expect(channel).toStrictEqual(state.channelReducer["1-0x123"]);
  });

  test("should return the latest chanel by partner and token", async () => {
    const state = {
      channelReducer: {
        "1-Ox123": {},
        "2-0x321": {
          partner_address: "123",
          channel_identifier: 2,
        },
        "3-0x321": {
          partner_address: "123",
          channel_identifier: 3,
        },
      },
    };
    await initStoreWithData(state);
    const channel = channelFunctions.getLatestChannelByPartnerAndToken(
      "123",
      "0x321"
    );
    expect(channel).toStrictEqual(state.channelReducer["3-0x321"]);
  });
});
