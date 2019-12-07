import client from "../../apiRest";
import { ADD_NEW_TOKEN } from "./types";

export const requestTokenAddressFromTokenNetwork = tokenNetwork => async dispatch => {
  try {
    const url = `tokens/network/${tokenNetwork}`;
    const res = await client.get(url);
    dispatch({ type: ADD_NEW_TOKEN, tokenNetwork, tokenAddress: res.data });
    return res.data;
  } catch (error) {
    console.error(error);
  }
};

export const requestTokenNetworkFromTokenAddress = tokenAddress => async dispatch => {
  try {
    const url = `tokens/${tokenAddress}`;
    const res = await client.get(url);
    dispatch({ type: ADD_NEW_TOKEN, tokenNetwork: res.data, tokenAddress });
    return res.data;
  } catch (error) {
    console.error(error);
  }
};
