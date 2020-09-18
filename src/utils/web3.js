import Web3 from "web3";

export const getWeb3 = provider => {
  return new Web3(provider);
};
