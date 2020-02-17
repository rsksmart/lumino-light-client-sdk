import client from "../../apiRest";
import { ADD_NEW_TOKEN, ADD_NEW_TOKEN_NAME_SYMBOL } from "./types";
import { requestTokenNameAndSymbol } from "../functions/tokens";

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

export const getTokenNameAndSymbol = tokenAddress => async (
  dispatch,
  getState
) => {
  const { tokenNames } = getState();
  if (tokenNames[tokenAddress]) {
    return {
      token_name: tokenNames[tokenAddress].token_name,
      token_symbol: tokenNames[tokenAddress].token_symbol,
    };
  }

  const data = await requestTokenNameAndSymbol(tokenAddress);
  const token_name = data.name;
  const token_symbol = data.symbol;
  dispatch({
    type: ADD_NEW_TOKEN_NAME_SYMBOL,
    token_name,
    token_symbol,
    token_address: tokenAddress,
  });

  return {
    token_name,
    token_symbol,
  };
};
