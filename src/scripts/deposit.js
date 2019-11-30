import { tokenAbi, tokenNetworkAbi } from "./constants";
import Web3 from "web3";
import Lumino from "../Lumino/index";

export const createApprovalTx = async params => {
  try {
    const { rskEndpoint, chainId } = Lumino.getConfig();
    const web3 = new Web3(rskEndpoint);
    const txCount = await web3.eth.getTransactionCount(params.address);
    const token = new web3.eth.Contract(tokenAbi, params.tokenAddress);
    const approval = {
      nonce: web3.utils.toHex(txCount),
      gasPrice: params.gasPrice,
      gasLimit: params.gasLimitApproval,
      to: params.tokenAddress,
      value: "0x00",
      data: token.methods
        .approve(params.tokenNetworkAddress, params.amount)
        .encodeABI(),
      chainId,
    };

    return approval;
  } catch (e) {
    throw e;
  }
};

export const createDepositTx = async params => {
  try {
    const { rskEndpoint, chainId } = Lumino.getConfig();
    const web3 = new Web3(rskEndpoint);
    const tokenNetwork = new web3.eth.Contract(
      tokenNetworkAbi,
      params.tokenNetworkAddress
    );
    const txCount = await web3.eth.getTransactionCount(params.address);
    const deposit = {
      nonce: web3.utils.toHex(txCount + 1),
      gasPrice: params.gasPrice,
      gasLimit: params.gasLimitDeposit,
      to: params.tokenNetworkAddress,
      value: "0x00",
      data: tokenNetwork.methods
        .setTotalDeposit(
          params.channelId,
          params.address,
          params.amount,
          params.partner
        )
        .encodeABI(),
      chainId,
    };

    return deposit;
  } catch (e) {
    throw e;
  }
};
