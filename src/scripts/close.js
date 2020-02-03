import { tokenNetworkAbi } from "./constants";
import Web3 from "web3";
import Lumino from "../Lumino/index";
import {
  DEFAULT_GAS_PRICE,
  DEFAULT_GAS_LIMIT,
} from "../config/channelParamsConstants";

const balance_hash =
  "0x00000000000000000000000000000000000000000000000000000000000000";
const nonce = 0;
const additional_hash =
  "0x00000000000000000000000000000000000000000000000000000000000000";
const signature =
  "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

export const createCloseTx = async params => {
  const { rskEndpoint, chainId } = Lumino.getConfig();
  const web3 = new Web3(rskEndpoint);
  const tokenNetwork = new web3.eth.Contract(
    tokenNetworkAbi,
    params.tokenNetworkAddress
  );

  const txCount = await web3.eth.getTransactionCount(params.address);
  const close = {
    nonce: web3.utils.toHex(txCount),
    gasPrice: params.gasPrice || DEFAULT_GAS_PRICE,
    gasLimit: params.gasLimit || DEFAULT_GAS_LIMIT,
    to: params.tokenNetworkAddress,
    value: "0x00",
    data: tokenNetwork.methods
      .closeChannel(
        params.channel_identifier,
        params.partner,
        balance_hash,
        nonce,
        additional_hash,
        signature
      )
      .encodeABI(),
    chainId,
  };

  return close;
};
