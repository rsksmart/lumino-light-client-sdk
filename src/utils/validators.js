import { ethers } from "ethers";
import { CHANNEL_OPENED } from "../config/channelStates";
import { getPaymentIds } from "../store/functions";
import { getPackedData } from "./pack";

/**
 *
 * @param {arrayish} message The message with the signature to be checked
 */
export const signatureRecover = message => {
  const { verifyMessage } = ethers.utils;
  // TODO: Some cases are failing due to not having appropiate pack functions
  return verifyMessage(getPackedData(message), message.signature);
};

const getBN = number => {
  return ethers.utils.bigNumberify(`${number}`)._hex;
};

const throwGenericLockedTransfer = param => {
  throw new Error(
    `The Received Locked Transfer ${param} does not match the requested payment`
  );
};

const throwChannelNotFoundOrNotOpened = partner => {
  throw new Error(
    `The Received Locked Transfer speciefied a channel with the partner: ${partner}, which is closed or does not exist`
  );
};

/**
 * Validates that the parameters received in the LT from the hub are reasonable within what we provided to it.
 * It checks for: Partner, Amount, Token, Address and Signature
 */
export const validateLockedTransfer = (message, requestBody, channels = {}) => {
  const { getAddress } = ethers.utils;
  const hasSamePartner =
    getAddress(message.target) === requestBody.partner_address;
  if (!hasSamePartner) throwGenericLockedTransfer("Partner");
  const hasSameAmount =
    getBN(message.lock.amount) === getBN(requestBody.amount);
  if (!hasSameAmount) throwGenericLockedTransfer("Amount");
  const hasSameTokenAddress =
    getAddress(message.token) === requestBody.token_address;
  if (!hasSameTokenAddress) throwGenericLockedTransfer("Token Address");
  const hasChannelAndIsOpened =
    channels[message.channel_identifier] === CHANNEL_OPENED;
  if (!hasChannelAndIsOpened)
    throwChannelNotFoundOrNotOpened(message.partner_address);

  // const hasSameSignature // TODO: Pending implementation
};

export const getPaymentChannelById = id => {
  const payments = getPaymentIds();
  if (!payments[id]) return false;
  return payments[id];
};
