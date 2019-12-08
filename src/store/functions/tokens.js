import Store from "../index";
import { swapObjValueForKey } from "../../utils/functions";
import Lumino from "../../Lumino";
import Web3 from "web3";
import { tokenAbi } from "../../scripts/constants";

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

export const requestTokenNameAndSymbol = async tokenAddress => {
  try {
    const { rskEndpoint } = Lumino.getConfig();
    const web3 = new Web3(rskEndpoint);
    const token = new web3.eth.Contract(tokenAbi, tokenAddress);
    const name = await token.methods.name().call();
    const symbol = await token.methods.symbol().call();

    return { name, symbol };
  } catch (error) {
    console.log(error);
  }
};

export const searchTokenDataInChannels = tokenAddress => {
  const channels = Store.getStore().getState().channelReducer;
  const ch = Object.keys(channels).find(c => c.includes(tokenAddress));
  const { tokenName, tokenSymbol } = channels[ch];
  return { tokenName, tokenSymbol };
};
