import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { NON_CLOSED_STATES } from "../config/channelStates";

const getGreater = (n1, n2) => (n1 > n2 ? n1 : n2);

/**
 * Checksums an address
 * @param {*} addr The address to be checksummed
 */
export const chkSum = addr => ethers.utils.getAddress(addr);

/**
 * This methods performs a simple loop through an array and return the highest numeric value
 * @param {Array} arr The array of objects
 * @param {String} key The key value which holds the numeric value
 */
const findMaxByKey = (arr, key) => {
  let max = 0;
  for (let c = 0; c < arr.length; c++) {
    max = getGreater(arr[c][key], max);
  }
  return max;
};

export const findMaxMsgInternalId = arr =>
  findMaxByKey(arr, "internal_msg_identifier");

export const findMaxBlockId = notifications =>
  findMaxByKey(notifications, "id");

export const findMaxChannelId = channels =>
  findMaxByKey(channels, "channel_identifier");

export const findNonClosedChannelWithPartner = (channels, partnerAddress) => {
  const partnerCksummed = chkSum(partnerAddress);

  const channel = Object.values(channels)
    .filter(channel => {
      // First we get the possible channels with the partner
      const pAddr = chkSum(channel.partner_address);
      if (partnerCksummed === pAddr) return true;
      return false;
    })
    // We then filter for the non closed states
    .find(({ sdk_status }) => NON_CLOSED_STATES[sdk_status]);
  return channel;
};

/**
 * This method takes an object with any number of keys and swaps the key for the value
 * @param {Object} data
 */
export const swapObjValueForKey = data =>
  Object.keys(data).reduce((obj, key) => ((obj[data[key]] = key), obj), {});

export const getRandomBN = () => {
  const randomBN = BigNumber.random(18).toString();
  return new BigNumber(randomBN.split(".")[1]).toString();
};

export const isRnsDomain = domain => {
  if (domain) {
    return domain.includes(".");
  }
  return false;
};
