import keccak from "keccak";
import crypto from "crypto";

/**
 * Returns a hash and a secret_hash encrypted with keccak256
 */
const generateHashes = () => {
  const hash = `0x${crypto.randomBytes(32).toString("hex")}`;
  const secrethash = `0x${keccak("keccak256")
    .update(hash)
    .digest()
    .toString("hex")}`;
  return { hash, secrethash };
};

export default generateHashes;
