import { tokenNetworkAbi } from "./constants";
import Web3 from "web3";
import Lumino from "../Lumino/index";
import {
  DEFAULT_GAS_PRICE,
  DEFAULT_GAS_LIMIT,
} from "../config/channelParamsConstants";
import { getChannelByIdAndToken } from "../store/functions";
import { getTokenAddressByTokenNetwork } from "../store/functions/tokens";
import { createBalanceHash, createMessageHash } from "../utils/pack";

const ZERO_HASHES = {
  BALANCE: "0x00000000000000000000000000000000000000000000000000000000000000",
  ADDITIONAL:
    "0x00000000000000000000000000000000000000000000000000000000000000",
};

const NONCE_ZERO = 0;
const SIGNATURE_ZERO =
  "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

export const createCloseTx = async params => {
  const { rskEndpoint, chainId } = Lumino.getConfig();
  const { channelIdentifier, tokenNetworkAddress } = params;
  const token = getTokenAddressByTokenNetwork(tokenNetworkAddress);
  const channel = getChannelByIdAndToken(channelIdentifier, token);
  let balanceHash = ZERO_HASHES.BALANCE;
  let additionalHash = ZERO_HASHES.ADDITIONAL;
  let nonce = NONCE_ZERO;
  let signature = SIGNATURE_ZERO;

  const { nonClosingBp } = channel;

  if (nonClosingBp) {
    const { partner_balance_proof: pBP } = nonClosingBp;
    const { locksroot: lr, transferred_amount: ta, locked_amount: la } = pBP;
    signature = pBP.signature;
    nonce = pBP.nonce;
    balanceHash = createBalanceHash(ta, la, lr);
    additionalHash = createMessageHash(pBP);
  }
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
        channelIdentifier,
        params.partner,
        balanceHash,
        nonce,
        additionalHash,
        signature
      )
      .encodeABI(),
    chainId,
  };

  return close;
};
