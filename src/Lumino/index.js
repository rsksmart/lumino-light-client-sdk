import Store from "../store/index";
import Actions from "../store/actions";
import client from "../apiRest";
import callbacks from "../utils/callbacks";
import {
  SET_CLIENT_ADDRESS,
  SET_REGISTRY_ADDRESS,
} from "../store/actions/types";
import notifier from "../notifierRest";
import { NOTIFIER_BASE_URL } from "../config/notifierConstants";
import { AddressZero } from "ethers/constants";
import Enveloping from "../handlers/Enveloping";

const Lumino = () => {
  let actions;
  let store;
  let luminoFns;
  let luminoConfig = {
    rskEndpoint: "",
    chainId: 0,
    hubEndpoint: "http://localhost:5001/api/v1",
    address: "",
    apiKey: "",
    notifierEndPoint: NOTIFIER_BASE_URL,
    registryAddress: AddressZero,
    useNotifiers: false,
    enveloping: {
      relayVerifierContractAddress: "",
      deployVerifierContractAddress: "",
      relayHubContractAddress: "",
      smartWalletFactoryContractAddress: "",
      preferredRelays: [],
    },
  };

  /**
   * Init Lumino
   * @param {object} luminoHandler - An object that contains a sign property, which is a function to sign TX's onChain and a offChainSign for offChain TX's
   * @param {object} storage -  Object with 2 params, getLuminoData and saveLuminoData, so the lumino state can be persisted through a storage
   */
  const init = async (luminoHandler, storage, configParams) => {
    if (!store) {
      luminoConfig = { ...luminoConfig, ...configParams };
      store = await Store.initStore(
        storage,
        luminoHandler,
        luminoConfig.apiKey,
        luminoConfig.enveloping
          ? new Enveloping(luminoHandler, luminoConfig)
          : false
      );
      actions = Store.bindActions(Actions, store.dispatch);
      // Set address
      store.dispatch({
        type: SET_CLIENT_ADDRESS,
        address: configParams.address,
      });
      // Set RNS registry address
      store.dispatch({
        type: SET_REGISTRY_ADDRESS,
        registryAddress: configParams.registryAddress,
      });
      const changesHook = fn => store.subscribe(fn);
      const luminoInternalState = store.getState();
      const getLuminoInternalState = () => store.getState();
      client.defaults.baseURL = luminoConfig.hubEndpoint;
      notifier.defaults.baseURL = luminoConfig.notifierEndPoint;
      actions = { ...actions };
      luminoFns = {
        actions,
        changesHook,
        getLuminoInternalState,
        luminoInternalState,
      };
    }
    return { ...luminoFns };
  };

  /**
   * Returns the config of the lumino instance
   */
  const getConfig = () => luminoConfig;

  /**
   * Returns the actual lumino instance
   */
  const get = () => {
    if (store) return { ...luminoFns };
    throw new Error("Lumino has not been initialized");
  };

  /**
   * Gets the options for the RNS object needed to use rnsjs library
   * @returns an object like {{networkId: (() => number) | number, contractAddresses: {registry: string}}}
   */
  const getRNSOptions = () => {
    return {
      networkId: luminoConfig.chainId,
      contractAddresses: {
        registry: luminoConfig.registryAddress,
      },
    };
  };

  /**
   * Destroys the lumino instance
   */
  const destroy = () => {
    if (store) Store.stopAllPollings(Actions);
    actions = null;
    store = null;
    luminoFns = null;
    luminoConfig = {
      rskEndpoint: "",
      chainId: 0,
      hubEndpoint: "http://localhost:5001/api/v1",
      address: "",
      apiKey: "",
      notifierEndPoint: NOTIFIER_BASE_URL,
      enveloping: {
        relayVerifierContractAddress: "",
        deployVerifierContractAddress: "",
        relayHubContractAddress: "",
        smartWalletFactoryContractAddress: "",
      },
    };
  };

  const reConfigure = async (luminoHandler, storage, configParams) => {
    destroy();
    return init(luminoHandler, storage, configParams);
  };

  return {
    callbacks,
    init,
    get,
    getConfig,
    destroy,
    reConfigure,
    getRNSOptions,
  };
};

const instance = Lumino();

export default instance;
