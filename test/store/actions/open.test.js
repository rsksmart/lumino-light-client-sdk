import * as tokenFunctions from "../../../src/store/functions/tokens";
import * as openScripts from "../../../src/scripts/open";
import * as signatureResolver from "../../../src/utils/handlerResolver";
import callbacks, { CALLBACKS } from "../../../src/utils/callbacks";
import client from "../../../src/apiRest";
import * as openActions from "../../../src/store/actions/open";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import { ADD_CHANNEL_WAITING_FOR_OPENING } from "../../../src/store/actions/types";
import { CHANNEL_OPENED } from "../../../src/config/channelStates";
import { chkSum, UUIDv4 } from "../../../src/utils/functions";

// Mock store
const lh = {
  storage: { saveLuminoData: jest.fn() },
};
const middlewares = [thunk.withExtraArgument(lh)];
const mockStore = configureMockStore(middlewares);

const address = chkSum("0x920984391853d81CCeeC41AdB48a45D40594A0ec");
const randomPartner = chkSum("0xB59ef6015d0e5d46AC9515dcd3f8b928Bb7F87d3");
const randomAddress = chkSum("0xe3066B701f4a3eC8EcAA6D63ADc45180e5022bA3");

jest.useFakeTimers();

describe("test open channel action", () => {
  const spyOpen = jest.spyOn(openScripts, "createOpenTx");
  const spyResolver = jest.spyOn(signatureResolver, "default");
  const spyCallbacks = jest.spyOn(callbacks, "trigger");
  const spyTokenNetwork = jest.spyOn(
    tokenFunctions,
    "getTokenNetworkByTokenAddress"
  );
  const spyTokenNameSymbol = jest.spyOn(
    tokenFunctions,
    "requestTokenNameAndSymbol"
  );
  const state = {
    client: {
      address,
    },
    notifier: {
      notifiers: {},
    },
    channelReducer: {},
  };

  afterEach(() => {
    spyOpen.mockReset();
    spyResolver.mockReset();
    spyCallbacks.mockReset();
    spyTokenNameSymbol.mockReset();
    spyTokenNetwork.mockReset();
  });

  test("should request a new channel with success", async () => {
    const store = mockStore(state);
    // Values

    const token_name = "LUMINO";
    const token_symbol = "LUM";

    // Spies

    spyTokenNetwork.mockReturnValue("123");
    spyOpen.mockReturnValue({ rawTx: 123 });
    spyResolver.mockResolvedValue("0x123456");
    spyTokenNameSymbol.mockResolvedValue({
      name: token_name,
      symbol: token_symbol,
    });
    client.put.mockImplementationOnce(() =>
      Promise.resolve({ data: { channel_identifier: 1 } })
    );

    const internalChannelId = UUIDv4();

    await store.dispatch(
      openActions.openChannel({
        partner: randomPartner,
        tokenAddress: randomAddress,
        internalChannelId
      })
    );

    expect(spyCallbacks).toHaveBeenCalledWith(CALLBACKS.REQUEST_OPEN_CHANNEL, {
      token_name,
      token_symbol,
      partner_address: randomPartner,
      creator_address: address,
      token_address: randomAddress,
      internalChannelId
    });
    const actions = store.getActions();

    expect(actions.length).toBe(2);
    const expectedActionZero = {
      channel: {
        token_name: "LUMINO",
        token_symbol: "LUM",
        creator_address: address,
        offChainBalance: "0",
        partner_address: randomPartner,
        token_address: randomAddress,
        internalChannelId
      },
      type: ADD_CHANNEL_WAITING_FOR_OPENING,
    };

    const expectedActionOne = {
      channel: {
        channel_identifier: 1,
        hubAnswered: true,
        openedByUser: true,
        sdk_status: "CHANNEL_AWAITING_NOTIFICATION",
        token_name: "LUMINO",
        token_symbol: "LUM",
        internalChannelId
      },
      channelId: 1,
      numberOfNotifiers: 0,
      type: "OPEN_CHANNEL",
    };
    expect(actions[0]).toStrictEqual(expectedActionZero);
    expect(actions[1]).toStrictEqual(expectedActionOne);
  });

  test("should trigger error callback on error (request to HUB)", async () => {
    const store = mockStore(state);
    // Values

    const token_name = "LUMINO";
    const token_symbol = "LUM";

    // Spies

    spyTokenNetwork.mockReturnValue("123");
    spyOpen.mockReturnValue({ rawTx: 123 });
    spyResolver.mockResolvedValue("0x123456");
    spyTokenNameSymbol.mockResolvedValue({
      name: token_name,
      symbol: token_symbol,
    });
    client.put.mockImplementationOnce(() => Promise.reject("Generic Error"));

    const internalChannelId = UUIDv4();

    await store.dispatch(
      openActions.openChannel({
        partner: randomPartner,
        tokenAddress: randomAddress,
        internalChannelId
      })
    );

    expect(spyCallbacks).toBeCalledTimes(2);
    const channelData = {
      token_name,
      token_symbol,
      partner_address: randomPartner,
      creator_address: address,
      token_address: randomAddress,
      internalChannelId
    };
    expect(spyCallbacks).toHaveBeenNthCalledWith(
      1,
      CALLBACKS.REQUEST_OPEN_CHANNEL,
      channelData
    );
    expect(spyCallbacks).toHaveBeenNthCalledWith(
      2,
      CALLBACKS.FAILED_OPEN_CHANNEL,
      channelData,
      "Generic Error"
    );
  });

  test("should trigger error callback on opening channel with yourself", async () => {
    const store = mockStore(state);

    await store.dispatch(
      openActions.openChannel({
        partner: address,
        tokenAddress: randomAddress,
      })
    );

    expect(spyCallbacks).toBeCalledTimes(1);
    const expectedError = new Error("Can't create channel with yourself");
    const expectedChannel = {
      partner: address,
    };
    expect(spyCallbacks).toHaveBeenNthCalledWith(
      1,
      CALLBACKS.FAILED_OPEN_CHANNEL,
      expectedChannel,
      expectedError
    );
  });

  test("should trigger error callback on opening channel with partner when non closed channel exists", async () => {
    const fakeChannel = { sdk_status: CHANNEL_OPENED, partner_address: randomPartner, token_address: randomAddress };
    const fakeChannelKey = `200-${randomAddress}`;
    const store = mockStore({
      ...state,
      channelReducer: { [fakeChannelKey]: fakeChannel },
    });

    await store.dispatch(
      openActions.openChannel({
        partner: randomPartner,
        tokenAddress: randomAddress,
      })
    );

    expect(spyCallbacks).toBeCalledTimes(1);
    const expectedError = new Error(
      "A non closed channel exists with partner already on that token"
    );
    const expectedChannel = {
      partner: randomPartner,
    };
    expect(spyCallbacks).toHaveBeenNthCalledWith(
      1,
      CALLBACKS.FAILED_OPEN_CHANNEL,
      expectedChannel,
      expectedError
    );
  });
});
