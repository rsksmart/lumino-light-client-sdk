import { tokenNetworkAbi } from "./constants";
import Web3 from "web3";
import Lumino from "../Lumino/index";
import {
  DEFAULT_GAS_PRICE,
  DEFAULT_GAS_LIMIT,
} from "../config/channelParamsConstants";

export const createSettleTx = async params => {
  const { rskEndpoint, chainId } = Lumino.getConfig();
  const { channelIdentifier, p1, p2, tokenNetworkAddress } = params;

  const web3 = new Web3(rskEndpoint);
  const tokenNetwork = new web3.eth.Contract(
    tokenNetworkAbi,
    tokenNetworkAddress
  );

  const txCount = await web3.eth.getTransactionCount(params.address);
  const settle = {
    nonce: web3.utils.toHex(txCount),
    gasPrice: params.gasPrice || DEFAULT_GAS_PRICE,
    gasLimit: params.gasLimit || DEFAULT_GAS_LIMIT,
    to: tokenNetworkAddress,
    value: "0x00",
    data: tokenNetwork.methods
      .settleChannel(
        channelIdentifier,
        p1.address,
        // Conversion to hex, due to BN casting to String and Web3 does not accept String for uint256
        web3.utils.toHex(p1.transferred_amount),
        web3.utils.toHex(p1.locked_amount),
        p1.locksroot,
        p2.address,
        web3.utils.toHex(p2.transferred_amount),
        web3.utils.toHex(p2.locked_amount),
        p2.locksroot
      )
      .encodeABI(),
    chainId,
  };

  return settle;
};
