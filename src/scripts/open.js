import { tokenNetworkAbi } from "./constants";
import Web3 from "web3";
import Lumino from "../Lumino/index";

export const createOpenTx = async params => {
  try {
    const { rskEndpoint, chainId } = Lumino.getConfig();
    const web3 = new Web3(rskEndpoint);
    const tokenNetwork = new web3.eth.Contract(
      tokenNetworkAbi,
      params.tokenNetworkAddress
    );
    const txCount = await web3.eth.getTransactionCount(params.address);
    const open = {
      nonce: web3.utils.toHex(txCount),
      gasPrice: params.gasPrice,
      gasLimit: params.gasLimit,
      to: params.tokenNetworkAddress,
      value: "0x00",
      data: tokenNetwork.methods
        .openChannel(params.address, params.partner, params.settleTimeout)
        .encodeABI(),
      chainId,
    };
    return open;
  } catch (e) {
    throw e;
  }
};
