import { getWeb3 } from "../../src/utils/web3";
import Web3 from "web3";

describe("Test web3 utils", () => {
  it("returns an instance of web3", () => {
    const url = "http://localhost:4444";
    const web3 = getWeb3(url);
    expect(web3).toBeTruthy();
    expect(web3).toBeInstanceOf(Web3);
  });
});
