import { secretRegistryABI } from "./constants";
import {
  DEFAULT_GAS_LIMIT,
  DEFAULT_GAS_PRICE,
} from "../config/channelParamsConstants";
import Web3 from "web3";
import Lumino from "../Lumino/index";

export const createRegisterSecretTx = async params => {
  const { rskEndpoint, chainId } = Lumino.getConfig();
  const { secretRegistryAddress } = params;
  const web3 = new Web3(rskEndpoint);
  const secretRegistry = new web3.eth.Contract(
    secretRegistryABI,
    secretRegistryAddress
  );
  const txCount = await web3.eth.getTransactionCount(params.address);
  const registerTx = {
    nonce: web3.utils.toHex(txCount),
    gasPrice: params.gasPrice || DEFAULT_GAS_PRICE,
    gasLimit: params.gasLimit || DEFAULT_GAS_LIMIT,
    to: secretRegistryAddress,
    value: "0x00",
    data: secretRegistry.methods.registerSecret(params.secret).encodeABI(),
    chainId,
  };
  return registerTx;
};
