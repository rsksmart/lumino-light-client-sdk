import { tokenNetworkAbi } from "./constants";
import {
  DEFAULT_GAS_LIMIT,
  DEFAULT_GAS_PRICE,
} from "../config/channelParamsConstants";
import Web3 from "web3";
import Lumino from "../Lumino/index";

export const createUnlockTx = async params => {
  const { rskEndpoint, chainId } = Lumino.getConfig();
  const { tokenNetworkAddress } = params;
  const web3 = new Web3(rskEndpoint);
  const tokenNetwork = new web3.eth.Contract(
    tokenNetworkAbi,
    tokenNetworkAddress
  );
  const txCount = await web3.eth.getTransactionCount(params.address);
  const unlock = {
    nonce: web3.utils.toHex(txCount),
    gasPrice: params.gasPrice || DEFAULT_GAS_PRICE,
    gasLimit: params.gasLimit || DEFAULT_GAS_LIMIT,
    to: tokenNetworkAddress,
    value: "0x00",
    data: tokenNetwork.methods
      .unlock(
        params.channelIdentifier,
        params.receiver,
        params.sender,
        params.leaves
      )
      .encodeABI(),
    chainId,
  };
  return unlock;
};
