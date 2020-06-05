import { tokenNetworkAbi } from "./constants";
import {
  DEFAULT_SETTLE_TIMEOUT,
  DEFAULT_GAS_LIMIT,
  DEFAULT_GAS_PRICE,
} from "../config/channelParamsConstants";
import Web3 from "web3";
import Lumino from "../Lumino/index";

export const createOpenTx = async params => {
  const { rskEndpoint, chainId } = Lumino.getConfig();
  const web3 = new Web3(rskEndpoint);
  const tokenNetwork = new web3.eth.Contract(
    tokenNetworkAbi,
    params.tokenNetworkAddress
  );
  const txCount = await web3.eth.getTransactionCount(params.address);
  const open = {
    nonce: web3.utils.toHex(txCount),
    gasPrice: params.gasPrice || DEFAULT_GAS_PRICE,
    gasLimit: params.gasLimit || DEFAULT_GAS_LIMIT,
    to: params.tokenNetworkAddress,
    value: "0x00",
    data: tokenNetwork.methods
      .openChannel(
        params.address,
        params.partner,
        params.settleTimeout || DEFAULT_SETTLE_TIMEOUT
      )
      .encodeABI(),
    chainId,
  };
  return open;
};
