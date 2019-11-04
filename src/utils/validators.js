import { ethers } from "ethers";
import { CHANNEL_OPENED } from "../config/channelStates";
import { getPaymentIds } from "../store/functions";

export const validateOpenChannelParams = obj => {
  if (Object.keys(obj).length < 3)
    throw new Error("Invalid quantity of params");
  return true;
};

/**
 *
 * @param {arrayish} original The data as in an arrayish form of ethers
 * @param {string} signature The signature of the data
 */
export const signatureRecover = (original, signature) => {
  // return ethers.utils.recoverAddress(original, signature);
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
  // HACK: The HUB is returning the addresses in a not checksum format, so we do it first
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
