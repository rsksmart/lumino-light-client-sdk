import * as tokenFunctions from "../../../src/store/functions/tokens";
import * as openScripts from "../../../src/scripts/open";
import * as signatureResolver from "../../../src/utils/handlerResolver";
import callbacks, { CALLBACKS } from "../../../src/utils/callbacks";
import client from "../../../src/apiRest";
import * as openActions from "../../../src/store/actions/open";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

// Mock store
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";
const randomPartner = "0xB59ef6015d0e5d46AC9515dcd3f8b928Bb7F87d3";
const randomAddress = "0xe3066B701f4a3eC8EcAA6D63ADc45180e5022bA3";

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

    await store.dispatch(
      openActions.openChannel({
        partner: randomPartner,
        tokenAddress: randomAddress,
      })
    );

    expect(spyCallbacks).toHaveBeenCalledWith(CALLBACKS.REQUEST_OPEN_CHANNEL, {
      token_name,
      token_symbol,
      partner_address: randomPartner,
      creator_address: address,
      token_address: randomAddress,
    });
    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      channel: {
        channel_identifier: 1,
        sdk_status: "CHANNEL_AWAITING_NOTIFICATION",
        token_name: "LUMINO",
        token_symbol: "LUM",
      },
      channelId: 1,
      type: "OPEN_CHANNEL",
    };
    expect(actions[0]).toStrictEqual(expectedAction);
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

    await store.dispatch(
      openActions.openChannel({
        partner: randomPartner,
        tokenAddress: randomAddress,
      })
    );

    expect(spyCallbacks).toBeCalledTimes(2);
    const channelData = {
      token_name,
      token_symbol,
      partner_address: randomPartner,
      creator_address: address,
      token_address: randomAddress,
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
});
