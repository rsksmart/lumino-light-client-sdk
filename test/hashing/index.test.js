import GenerateHashes from "../../src/utils/generateHashes";
import { ethers } from "ethers";

test("Can generate a has of random bytes", () => {
  const { hash, secrethash } = GenerateHashes();
  expect(ethers.utils.keccak256(hash)).toBe(secrethash);
});
