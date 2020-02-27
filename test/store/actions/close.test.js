import * as closeScripts from "../../../src/scripts/close";
import * as signatureResolver from "../../../src/utils/handlerResolver";
import callbacks, { CALLBACKS } from "../../../src/utils/callbacks";
import client from "../../../src/apiRest";
import * as closeActions from "../../../src/store/actions/close";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import * as stateFunctions from "../../../src/store/functions/state";

// Mock store
const lh = {
  storage: { saveLuminoData: jest.fn() },
};
const middlewares = [thunk.withExtraArgument(lh)];
const mockStore = configureMockStore(middlewares);

const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";
const randomPartner = "0xB59ef6015d0e5d46AC9515dcd3f8b928Bb7F87d3";
const randomAddress = "0xe3066B701f4a3eC8EcAA6D63ADc45180e5022bA3";

describe("test close channel action", () => {
  const spyClose = jest.spyOn(closeScripts, "createCloseTx");
  const spyResolver = jest.spyOn(signatureResolver, "default");
  const spyCallbacks = jest.spyOn(callbacks, "trigger");
  const spyGetState = jest.spyOn(stateFunctions, "getState");
  const channelKey = `1-${randomAddress}`;
  const state = {
    channelReducer: {
      [channelKey]: {
        partner_address: randomPartner,
        creator_address: address,
        token_address: randomAddress,
      },
    },
  };

  const params = {
    address,
    partner: randomPartner,
    tokenAddress: randomAddress,
    channelIdentifier: 1,
  };

  afterEach(() => {
    spyClose.mockReset();
    spyResolver.mockReset();
    spyCallbacks.mockReset();
    spyGetState.mockReset();
  });

  test("should request a close channel with success", async () => {
    const store = mockStore(state);

    // Spies

    spyResolver.mockResolvedValue("0x123456");
    spyClose.mockResolvedValue("0x12345679b");
    client.patch.mockImplementationOnce(() =>
      Promise.resolve({ data: { channel_identifier: 1 } })
    );
    spyGetState.mockImplementation(() => store.getState());
    await store.dispatch(closeActions.closeChannel(params));

    expect(spyCallbacks).toHaveBeenCalledWith(CALLBACKS.REQUEST_CLOSE_CHANNEL, {
      partner_address: randomPartner,
      creator_address: address,
      token_address: randomAddress,
    });
    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      channel: {
        channel_identifier: 1,
        sdk_status: "CHANNEL_WAITING_FOR_CLOSE",
      },
      type: "SET_CHANNEL_CLOSED",
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("should trigger error callback on error (request to HUB)", async () => {
    const store = mockStore(state);
    // Values

    const errorString = "Generic Error";

    // Spies
    spyGetState.mockImplementation(() => store.getState());
    spyResolver.mockResolvedValue("0x123456");
    client.patch.mockRejectedValue(errorString);

    await store.dispatch(closeActions.closeChannel(params));

    expect(spyCallbacks).toBeCalledTimes(2);
    const channelData = {
      partner_address: randomPartner,
      creator_address: address,
      token_address: randomAddress,
    };
    expect(spyCallbacks).toHaveBeenNthCalledWith(
      1,
      CALLBACKS.REQUEST_CLOSE_CHANNEL,
      channelData
    );
    expect(spyCallbacks).toHaveBeenNthCalledWith(
      2,
      CALLBACKS.FAILED_CLOSE_CHANNEL,
      channelData,
      errorString
    );
  });
});
