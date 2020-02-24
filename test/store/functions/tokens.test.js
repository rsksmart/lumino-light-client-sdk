import * as tokenFunctions from "../../../src/store/functions/tokens";
import Store from "../../../src/store";
import { LocalStorageHandler } from "../../../src";
import { swapObjValueForKey } from "../../../src/utils/functions";

describe("Test token functions", () => {
  afterEach(() => {
    Store.destroyStore();
  });

  const initStoreWithData = async data => {
    LocalStorageHandler.saveLuminoData(data);
    await Store.initStore(LocalStorageHandler, {});
  };

  test("should return token networks and their token", async () => {
    const state = {
      tokenNetworks: {
        "123": "t123",
        "321": "t321",
      },
    };
    await initStoreWithData(state);
    const networks = tokenFunctions.getKnownTokenNetworks();
    expect(networks).toStrictEqual(state.tokenNetworks);
  });

  test("should return token addresses and their networks", async () => {
    const state = {
      tokenNetworks: {
        "123": "t123",
        "321": "t321",
      },
    };
    await initStoreWithData(state);
    const tokens = tokenFunctions.getKnownTokenAddresses();

    expect(tokens).toStrictEqual(swapObjValueForKey(state.tokenNetworks));
  });

  test("should get token address by token network", async () => {
    const state = {
      tokenNetworks: {
        "123": "t123",
        "321": "t321",
      },
    };
    await initStoreWithData(state);
    const address = tokenFunctions.getTokenAddressByTokenNetwork("123");

    expect(address).toBe(state.tokenNetworks["123"]);
  });

  test("should get token network by token address", async () => {
    const state = {
      tokenNetworks: {
        "123": "t123",
        "321": "t321",
      },
    };
    await initStoreWithData(state);
    const address = tokenFunctions.getTokenNetworkByTokenAddress("t123");

    expect(address).toBe("123");
  });

  test("should get token name and symbol from an existent channel", async () => {
    const state = {
      channelReducer: {
        "1-0x123": { token_name: "test", token_symbol: "TEST" },
        "2-0x321": { token_name: "test2", token_symbol: "TEST2" },
      },
    };
    await initStoreWithData(state);
    const { tokenName, tokenSymbol } = tokenFunctions.searchTokenDataInChannels(
      "0x123"
    );
    expect(tokenName).toBe("test");
    expect(tokenSymbol).toBe("TEST");
  });
});
