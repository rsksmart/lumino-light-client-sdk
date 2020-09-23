import { chkSum, swapObjValueForKey } from "../../utils/functions";
import Lumino from "../../Lumino";
import { tokenAbi } from "../../scripts/constants";
import { getState } from "./state";
import { getWeb3 } from "../../utils/web3";

/**
 * Returns the Token Networks and their corresponding Token Address
 */
export const getKnownTokenNetworks = () => getState().tokenNetworks;

/**
 * Returns the Token Addresses and their corresponding Token Network
 */
export const getKnownTokenAddresses = () =>
  swapObjValueForKey(getState().tokenNetworks);

/**
 * Returns the Token Address corresponding to a Token Network, or null
 * @param {string} tokenNetwork
 */
export const getTokenAddressByTokenNetwork = tokenNetwork => {
  const tokenNetworks = getKnownTokenNetworks();
  return chkSum(tokenNetworks[tokenNetwork]) || null;
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
    const web3 = getWeb3(rskEndpoint);
    const token = new web3.eth.Contract(tokenAbi, tokenAddress);
    const name = await token.methods.name().call();
    const symbol = await token.methods.symbol().call();

    return { name, symbol };
  } catch (error) {
    console.log(error);
  }
};

export const searchTokenDataInChannels = tokenAddress => {
  const channels = getState().channelReducer;
  const ch = Object.keys(channels).find(c => c.includes(tokenAddress));
  const { token_name: tokenName, token_symbol: tokenSymbol } = channels[ch];
  return { tokenName, tokenSymbol };
};
