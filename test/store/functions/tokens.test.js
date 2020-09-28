import * as tokenFunctions from "../../../src/store/functions/tokens";
import Store from "../../../src/store";
import { LocalStorageHandler } from "../../../src";
import { swapObjValueForKey } from "../../../src/utils/functions";

const addr1 = "0x7D49E67C730A625ADCeB000951D792505aFf4f17";
const addr2 = "0xff26fa3EA651aa9806c70EAE6A2a9E86E72bF048";
const addr3 = "0x01252550e9a5BF537e4dBe8F1dc444E541d0d799";
const addr4 = "0x03c7250C44e7E1bBC7577dD6Ba0CF4F7a628b92F";

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
        [addr1]: addr2,
        [addr3]: addr4,
      },
    };
    await initStoreWithData(state);
    const networks = tokenFunctions.getKnownTokenNetworks();
    expect(networks).toStrictEqual(state.tokenNetworks);
  });

  test("should return token addresses and their networks", async () => {
    const state = {
      tokenNetworks: {
        [addr1]: addr2,
        [addr3]: addr4,
      },
    };
    await initStoreWithData(state);
    const tokens = tokenFunctions.getKnownTokenAddresses();

    expect(tokens).toStrictEqual(swapObjValueForKey(state.tokenNetworks));
  });

  test("should get token address by token network", async () => {
    const state = {
      tokenNetworks: {
        [addr1]: addr2,
        [addr3]: addr4,
      },
    };
    await initStoreWithData(state);
    const address = tokenFunctions.getTokenAddressByTokenNetwork(addr1);

    expect(address).toBe(state.tokenNetworks[addr1]);
  });

  test("should get token network by token address", async () => {
    const state = {
      tokenNetworks: {
        [addr1]: addr2,
        [addr3]: addr4,
      },
    };
    await initStoreWithData(state);
    const address = tokenFunctions.getTokenNetworkByTokenAddress(addr2);

    expect(address).toBe(addr1);
  });

  test("should get token name and symbol from an existent channel", async () => {
    const key1 = `1-${addr1}`;
    const key2 = `1-${addr3}`;

    const state = {
      channelReducer: {
        [key1]: { token_name: "test", token_symbol: "TEST" },
        [key2]: { token_name: "test2", token_symbol: "TEST2" },
      },
    };
    await initStoreWithData(state);
    const { tokenName, tokenSymbol } = tokenFunctions.searchTokenDataInChannels(
      key1
    );
    expect(tokenName).toBe("test");
    expect(tokenSymbol).toBe("TEST");
  });
});
