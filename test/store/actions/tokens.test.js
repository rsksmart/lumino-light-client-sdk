import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import client from "../../../src/apiRest";
import { chkSum } from "../../../src/utils/functions";
import * as stateFunctions from "../../../src/store/functions/state";
import * as tokenFunctions from "../../../src/store/functions/tokens";
import {
  ADD_NEW_TOKEN,
  ADD_NEW_TOKEN_NAME_SYMBOL,
} from "../../../src/store/actions/types";
import {
  getTokenNameAndSymbol,
  requestTokenAddressFromTokenNetwork,
  requestTokenNetworkFromTokenAddress,
} from "../../../src/store/actions/tokens";

const address = chkSum("0x920984391853d81CCeeC41AdB48a45D40594A0ec");
const randomAddress = chkSum("0xe3066B701f4a3eC8EcAA6D63ADc45180e5022bA3");
// Mock store
const lh = {
  storage: { saveLuminoData: jest.fn() },
};
const middlewares = [thunk.withExtraArgument(lh)];
const mockStore = configureMockStore(middlewares);

describe("test token actions", () => {
  const state = {
    client: {
      address,
    },
    notifier: {
      notifiers: {},
    },
    channelReducer: {},
  };

  const spyGetState = jest.spyOn(stateFunctions, "getState");
  const spyTokenNameSymbol = jest.spyOn(
    tokenFunctions,
    "requestTokenNameAndSymbol"
  );

  afterEach(() => {
    spyGetState.mockReset();
  });

  it("dispatches and manages requestTokenAddressFromTokenNetwork", async () => {
    const store = mockStore(state);
    const tokenNetwork = randomAddress;
    client.get.mockImplementationOnce(() => Promise.resolve({ data: address }));
    const action = { type: ADD_NEW_TOKEN, tokenNetwork, tokenAddress: address };
    await store.dispatch(requestTokenAddressFromTokenNetwork(tokenNetwork));
    const actions = store.getActions();
    expect(actions.length).toBe(1);
    expect(actions[0]).toStrictEqual(action);
  });

  it("dispatches and manages requestTokenNetworkFromTokenAddress", async () => {
    const store = mockStore(state);
    const tokenAddress = randomAddress;
    client.get.mockImplementationOnce(() => Promise.resolve({ data: address }));
    const action = { type: ADD_NEW_TOKEN, tokenNetwork: address, tokenAddress };
    await store.dispatch(requestTokenNetworkFromTokenAddress(tokenAddress));
    const actions = store.getActions();
    expect(actions.length).toBe(1);
    expect(actions[0]).toStrictEqual(action);
  });

  it("dispatches and manages getTokenNameAndSymbol", async () => {
    const store = mockStore(state);
    const tokenAddress = randomAddress;
    const mockName = "RIF Token";
    const mockSymbol = "RIF";
    spyGetState.mockImplementationOnce(() => ({ tokenNames: {} }));
    spyTokenNameSymbol.mockImplementation(() =>
      Promise.resolve({ name: mockName, symbol: mockSymbol })
    );
    const action = {
      type: ADD_NEW_TOKEN_NAME_SYMBOL,
      token_name: mockName,
      token_symbol: mockSymbol,
      token_address: tokenAddress,
    };
    await store.dispatch(getTokenNameAndSymbol(tokenAddress));
    const actions = store.getActions();
    expect(actions.length).toBe(1);
    expect(actions[0]).toStrictEqual(action);
  });

  it("dispatches and manages getTokenNameAndSymbol when token is stored", async () => {
    const store = mockStore(state);
    const tokenAddress = randomAddress;
    const mockName = "RIF Token";
    const mockSymbol = "RIF";
    spyGetState.mockImplementationOnce(() => ({
      tokenNames: {
        [tokenAddress]: {
          token_name: mockName,
          token_symbol: mockSymbol,
        },
      },
    }));
    const { token_name, token_symbol } = await store.dispatch(
      getTokenNameAndSymbol(tokenAddress)
    );
    expect(token_name).toBe(mockName);
    expect(token_symbol).toBe(mockSymbol);
  });
});
