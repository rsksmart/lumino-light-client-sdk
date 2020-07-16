import * as depositScripts from "../../../src/scripts/deposit";
import * as signatureResolver from "../../../src/utils/handlerResolver";
import callbacks, { CALLBACKS } from "../../../src/utils/callbacks";
import client from "../../../src/apiRest";
import * as depositActions from "../../../src/store/actions/deposit";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import * as stateFunctions from "../../../src/store/functions/state";
import { CHANNEL_OPENED } from "../../../src/config/channelStates";
import { NEW_DEPOSIT } from "../../../src/store/actions/types";

// Mock store
const lh = {
  storage: { saveLuminoData: jest.fn() },
};
const middlewares = [thunk.withExtraArgument(lh)];
const mockStore = configureMockStore(middlewares);

const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";
const randomPartner = "0xB59ef6015d0e5d46AC9515dcd3f8b928Bb7F87d3";
const randomAddress = "0xe3066B701f4a3eC8EcAA6D63ADc45180e5022bA3";

describe("test close deposit action", () => {
  const spyDepositApprovalTX = jest.spyOn(depositScripts, "createApprovalTx");
  const spyDepositTX = jest.spyOn(depositScripts, "createDepositTx");
  const spyResolver = jest.spyOn(signatureResolver, "default");
  const spyCallbacks = jest.spyOn(callbacks, "trigger");
  const spyGetState = jest.spyOn(stateFunctions, "getState");
  const channelKey = `1-${randomAddress}`;
  const state = {
    client: {
      address,
    },
    channelReducer: {
      [channelKey]: {
        partner_address: randomPartner,
        creator_address: address,
        token_address: randomAddress,
        offChainBalance: "1000",
        total_deposit: "10000",
      },
    },
  };

  const params = {
    address,
    partner: randomPartner,
    tokenAddress: randomAddress,
    channelId: 1,
    amount: "1000000000",
  };

  afterEach(() => {
    spyDepositApprovalTX.mockReset();
    spyDepositTX.mockReset();
    spyResolver.mockReset();
    spyCallbacks.mockReset();
    spyGetState.mockReset();
  });

  test("should perform a proper deposit", async () => {
    const store = mockStore(state);

    // Spies
    spyGetState.mockImplementation(() => store.getState());
    spyDepositApprovalTX.mockImplementation(() => "0x123");
    spyDepositTX.mockImplementation(() => "0x123456");
    spyResolver.mockResolvedValue("0x123456");
    const resolvedMock = {
      data: { channel_identifier: 1, total_deposit: "1000001000" },
    };
    client.patch.mockResolvedValue(resolvedMock);

    await store.dispatch(depositActions.createDeposit(params));

    expect(spyCallbacks).toBeCalledTimes(1);
    const actionData = {
      partner_address: randomPartner,
      creator_address: address,
      token_address: randomAddress,
      total_deposit: "10000",
      offChainBalance: "1000",
      amount: "1000010000",
    };
    expect(spyCallbacks).toHaveBeenNthCalledWith(
      1,
      CALLBACKS.REQUEST_DEPOSIT_CHANNEL,
      actionData
    );

    const actions = store.getActions();
    expect(actions.length).toBe(1);
    const expectedAction = {
      type: NEW_DEPOSIT,
      channel: { ...resolvedMock.data, sdk_status: CHANNEL_OPENED },
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("should fail and trigger callback on error in deposit", async () => {
    const store = mockStore(state);

    // Spies
    spyGetState.mockImplementation(() => store.getState());
    spyDepositApprovalTX.mockImplementation(() => "0x123");
    spyDepositTX.mockImplementation(() => "0x123456");
    spyResolver.mockResolvedValue("0x123456");
    const failedMock = new Error("Something has happened");
    client.patch.mockRejectedValue(failedMock);

    await store.dispatch(depositActions.createDeposit(params));

    expect(spyCallbacks).toBeCalledTimes(2);
    const actionData = {
      partner_address: randomPartner,
      creator_address: address,
      token_address: randomAddress,
      total_deposit: "10000",
      offChainBalance: "1000",
      amount: "1000010000",
    };
    expect(spyCallbacks).toHaveBeenNthCalledWith(
      1,
      CALLBACKS.REQUEST_DEPOSIT_CHANNEL,
      actionData
    );

    const expectedFailure = {
      creator_address: address,
      offChainBalance: "1000",
      partner_address: randomPartner,
      token_address: randomAddress,
      total_deposit: "10000",
    };
    expect(spyCallbacks).toHaveBeenNthCalledWith(
      2,
      CALLBACKS.FAILED_DEPOSIT_CHANNEL,
      expectedFailure,
      failedMock
    );
  });
});
