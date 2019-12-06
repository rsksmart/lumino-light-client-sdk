import Store from "../index";
import { swapObjValueForKey } from "../../utils/functions";

/**
 * Returns the Token Networks and their corresponding Token Address
 */
export const getKnownTokenNetworks = () =>
  Store.getStore().getState().tokenNetworks;

/**
 * Returns the Token Addresses and their corresponding Token Network
 */
export const getKnownTokenAddresses = () =>
  swapObjValueForKey(Store.getStore().getState().tokenNetworks);

/**
 * Returns the Token Address corresponding to a Token Network, or null
 * @param {string} tokenNetwork
 */
export const getTokenAddressByTokenNetwork = tokenNetwork => {
  const tokenNetworks = getKnownTokenNetworks();
  return tokenNetworks[tokenNetwork] || null;
};

/**
 * Returns the Token Network corresponding to a Token Address, or null
 * @param {string} tokenAddress
 */
export const getTokenNetworkByTokenAddress = tokenAddress => {
  const tokenAddresses = getKnownTokenAddresses();
  return tokenAddresses[tokenAddress] || null;
};
