import Web3 from "web3";

import { SigningHandler, Lumino } from "../../src";
import { NOTIFIER_BASE_URL } from "../../src/config/notifierConstants";

const rskEndpoint = "http://localhost:4444";
const PRIV_KEY =
  "0x15f570a7914ed27b13ba4a63cee82ad4d77bba3cc60b037abef2f1733423eb70";
const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";

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

beforeEach(() => {
  expect(() => {
    Lumino.get();
  }).toThrow("Lumino has not been initialized");
});

afterEach(() => {
  Lumino.destroy();
});

test("should throw error when trying to access without init", async () => {
  expect(() => {
    Lumino.get();
  }).toThrow("Lumino has not been initialized");
});

test("should initialize lumino", async () => {
  const lumino = await Lumino.init(
    signingHandler,
    stubStorageHandler,
    configParams
  );

  expect(lumino).toHaveProperty("actions");
  const lumino2 = Lumino.get();
  expect(lumino2).toHaveProperty("actions");
});

test("should reinitialize lumino", async () => {
  const lumino = await Lumino.init(
    signingHandler,
    stubStorageHandler,
    configParams
  );

  const defaultParams = {
    rskEndpoint: "",
    chainId: 0,
    hubEndpoint: "http://localhost:5001/api/v1",
    address: "",
    apiKey: "",
    notifierEndPoint: NOTIFIER_BASE_URL,
  };

  expect(lumino).toHaveProperty("actions");
  const newParams = { ...defaultParams, ...configParams, testing: 123 };
  await Lumino.reConfigure(signingHandler, stubStorageHandler, newParams);
  const newConfig = Lumino.getConfig();
  expect(newConfig).toStrictEqual(newParams);
});

test("store stops polling before destruction", async () => {
  const lumino = await Lumino.init(
    signingHandler,
    stubStorageHandler,
    configParams
  );
  const actionsSpy = jest.spyOn(lumino.actions, "stopAllPolling");
  Lumino.destroy();
  expect(actionsSpy).toBeCalled();
});

test("should return internal state and not be empty", async () => {
  expect(Lumino);
  const lumino = await Lumino.init(
    signingHandler,
    stubStorageHandler,
    configParams
  );

  const state = lumino.getLuminoInternalState();
  expect(Object.keys(state).length).toBeGreaterThan(0);
});

test("internal state should be a non empty object", async () => {
  const lumino = await Lumino.init(
    signingHandler,
    stubStorageHandler,
    configParams
  );
  const luminoInternalStateKeys = Object.keys(lumino.luminoInternalState);

  expect(luminoInternalStateKeys.length).toBeGreaterThan(0);
});

test("can subscribe to the changesHook of the lumino store", async () => {
  const lumino = await Lumino.init(
    signingHandler,
    stubStorageHandler,
    configParams
  );
  const consoleChange = data => console.log(data);
  lumino.changesHook(consoleChange);
});

test("should return config of initialized Lumino", async () => {
  await Lumino.init(signingHandler, stubStorageHandler, configParams);

  const config = Lumino.getConfig();
  expect(config.address).toBeTruthy();
});

test("should return an instance of lumino on double init", async () => {
  const lumino = await Lumino.init(
    signingHandler,
    stubStorageHandler,
    configParams
  );
  expect(lumino).toBeTruthy();
  const lumino2 = await Lumino.init(
    signingHandler,
    stubStorageHandler,
    configParams
  );
  expect(lumino2).toBeTruthy();
  expect(lumino2.actions).toBeTruthy();
});
