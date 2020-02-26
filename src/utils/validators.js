import { ethers } from "ethers";
import { CHANNEL_OPENED } from "../config/channelStates";
import { getPackedData } from "./pack";
import Lumino from "../Lumino/index";

/**
 *
 * @param {arrayish} message The message with the signature
 */
export const signatureRecover = message => {
  const { verifyMessage } = ethers.utils;
  if (message.signature === "0x" || !message.signature) return "0x";
  return verifyMessage(getPackedData(message), message.signature);
};

const getBN = number => {
  return ethers.utils.bigNumberify(`${number}`)._hex;
};

const throwGenericLockedTransfer = param =>
  `The Received Locked Transfer ${param} does not match the requested payment`;

const throwChannelNotFoundOrNotOpened = partner =>
  `The Received Locked Transfer specified a channel with the partner: ${partner}, which is closed or does not exist`;

/**
 * Validates that the parameters received in the LT from the hub are reasonable within what we provided to it.
 * It checks for: Partner, Amount, Token, Address and Signature
 */
export const validateLockedTransfer = (message, requestBody, channels = {}) => {
  const { getAddress } = ethers.utils;
  const hasSamePartner =
    getAddress(message.target) === requestBody.partner_address;
  if (!hasSamePartner) return throwGenericLockedTransfer("Partner");
  const hasSameAmount =
    getBN(message.lock.amount) === getBN(requestBody.amount);
  if (!hasSameAmount) return throwGenericLockedTransfer("Amount");
  const hasSameTokenAddress =
    getAddress(message.token) === requestBody.token_address;
  if (!hasSameTokenAddress) return throwGenericLockedTransfer("Token Address");
  const channelId = `${message.channel_identifier}-${getAddress(
    message.token
  )}`;
  const hasChannelAndIsOpened = channels[channelId] === CHANNEL_OPENED;
  if (!hasChannelAndIsOpened)
    return throwChannelNotFoundOrNotOpened(message.partner_address);

  return true;
};

export const validateReceptionLT = (msg, channel = {}) => {
  const { getAddress } = ethers.utils;
  if (!channel.partner_address) return throwGenericLockedTransfer("Partner");
  const lcIsTarget =
    getAddress(msg.target) === getAddress(Lumino.getConfig().address);
  if (!lcIsTarget) return throwChannelNotFoundOrNotOpened(msg.target);
  const hasSameTokenAddress =
    getAddress(msg.token) === getAddress(channel.token_address);
  if (!hasSameTokenAddress) return throwGenericLockedTransfer("Token Address");
  return true;
};

export const isAddressFromPayment = (addFromSign, initiator, partner) => {
  const { getAddress } = ethers.utils;
  return (
    addFromSign === getAddress(initiator) || addFromSign === getAddress(partner)
  );
};

export const senderIsSigner = (addFromSign, sender) => {
  const { getAddress } = ethers.utils;
  return addFromSign === getAddress(sender);
};
