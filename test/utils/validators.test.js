import { ethers } from "ethers";
import { getPackedData } from "../../src/utils/pack";
import {
  senderIsSigner,
  isAddressFromPayment,
  validateReceptionLT,
  validateLockedTransfer,
} from "../../src/utils/validators";
import { LocalStorageHandler, Lumino } from "../../src";
import Store from "../../src/store";
import { CHANNEL_OPENED } from "../../src/config/channelStates";

const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";
const randomPartner = "0xB59ef6015d0e5d46AC9515dcd3f8b928Bb7F87d3";
const randomAddress = "0xe3066B701f4a3eC8EcAA6D63ADc45180e5022bA3";

describe("Test validators and their good / bad cases", () => {
  afterEach(() => {
    Store.destroyStore();
  });

  const initStoreWithData = async data => {
    LocalStorageHandler.saveLuminoData(data);
    await Store.initStore(LocalStorageHandler, {});
  };

  test("validateLockedTransfer should return true for a correct one", async () => {
    const channel = {
      partner_address: randomPartner,
      creator_address: address,
      channel_identifier: 1,
      token_address: randomAddress,
      offChainBalance: "10000000000000",
      sdk_status: CHANNEL_OPENED,
    };
    const LT = {
      target: randomPartner,
      lock: {
        amount: "10000000000000000000000",
      },
      token: randomAddress,
      channel_identifier: 1,
    };

    const ourSentData = {
      partner_address: randomPartner,
      amount: "10000000000000000000000",
      token_address: randomAddress,
    };
    const result = validateLockedTransfer(LT, ourSentData, channel);
    expect(result).toBe(true);
  });

  test("should return whether the sender is the signer or not", async () => {
    const data = {
      type: "Delivered",
      delivered_message_identifier: "18237677588114994956",
    };
    const signature =
      "0x5c71e9c516d088d937a1c2a969293fa0631ab9c1a8c7ff2780223c5d2446e272513fd8f80ec4f51999c8294115b1d35e6fc60c3d9af15d2c85205979be17c63a1c";
    const dataBeforeSigning = getPackedData(data);
    const recoveredAddress = ethers.utils.verifyMessage(
      dataBeforeSigning,
      signature
    );
    const result = senderIsSigner(address, recoveredAddress);
    expect(result).toBe(true);
  });

  test("should return true if address is involved in payment", async () => {
    // This is for example in a reception
    const result = isAddressFromPayment(address, randomPartner, address);
    expect(result).toBe(true);
  });

  test("should validate a correct reception LockedTransfer", async () => {
    const LT = {
      target: address,
      token: randomAddress,
    };
    const spyLumino = jest.spyOn(Lumino, "getConfig");
    spyLumino.mockReturnValueOnce({ address });
    const channelKey = `1-${randomAddress}`;
    const state = {
      channelReducer: {
        [channelKey]: {
          partner_address: randomPartner,
          token_address: randomAddress,
        },
      },
    };
    await initStoreWithData(state);
    const result = validateReceptionLT(LT, state.channelReducer[channelKey]);
    expect(result).toBe(true);
    spyLumino.mockReset();
  });

  test("should return a error string for incorrect reception LockedTransfer", async () => {
    const LT_BAD_TARGET = {
      target: randomAddress,
      token: address,
    };
    const spyLumino = jest.spyOn(Lumino, "getConfig");
    spyLumino.mockReturnValue({ address });
    const channelKey = `1-${randomAddress}`;
    const state = {
      channelReducer: {
        [channelKey]: {
          partner_address: randomPartner,
          token_address: randomAddress,
        },
      },
    };
    await initStoreWithData(state);
    const result1 = validateReceptionLT(
      LT_BAD_TARGET,
      state.channelReducer[channelKey]
    );
    const expectedError1 = `The Received Locked Transfer specified a channel with the partner: ${randomAddress}, which is closed or does not exist`;
    expect(result1).toBe(expectedError1);

    const LT_NO_TOKEN = {
      target: address,
      token: address,
    };

    const result2 = validateReceptionLT(
      LT_NO_TOKEN,
      state.channelReducer[channelKey]
    );
    const expectedError2 =
      "The Received Locked Transfer Token Address does not match the requested payment";
    expect(result2).toBe(expectedError2);
    spyLumino.mockReset();
  });
});
