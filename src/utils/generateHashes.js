import { ethers } from "ethers";

/**
 * Returns a hash and a secret_hash encrypted with keccak256
 */
const generateHashes = () => {
  const hash = ethers.utils.hexlify(ethers.utils.randomBytes(32));
  const secrethash = ethers.utils.keccak256(hash);
  return { hash, secrethash };
};

export default generateHashes;
