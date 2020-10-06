import { chkSum } from "../../../src/utils/functions";
import * as stateFunctions from "../../../src/store/functions/state";
import { Lumino, SigningHandler } from "../../../src";
import Web3 from "web3";
import { getRnsInstance } from "../../../src/store/functions/rns";

const address = chkSum("0x920984391853d81CCeeC41AdB48a45D40594A0ec");
const rskEndpoint = "http://localhost:4444";
const PRIV_KEY =
  "0x15f570a7914ed27b13ba4a63cee82ad4d77bba3cc60b037abef2f1733423eb70";

const configParams = {
  address,
  rskEndpoint,
};

const web3 = new Web3(rskEndpoint);
const signingHandler = SigningHandler();
signingHandler.init(web3, PRIV_KEY);

const stubStorageHandler = {
  getLuminoData: () => {},
  setLuminoData: () => {},
};

describe("rns store actions", () => {
  const spyGetState = jest.spyOn(stateFunctions, "getState");

  afterEach(() => {
    spyGetState.mockReset();
  });

  it("dispatches and manages requestTokenAddressFromTokenNetwork", async () => {
    await Lumino.init(signingHandler, stubStorageHandler, configParams);
    spyGetState.mockImplementation(() => ({
      rnsReducer: { registryAddress: address },
    }));
    const instance = getRnsInstance();
    expect(instance).toBeTruthy();
  });
});
