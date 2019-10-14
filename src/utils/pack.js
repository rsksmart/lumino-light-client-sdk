import { ethers } from "ethers";

/**
 * Encodes data to an appropiate hex format
 * @param {any} data - string/number/bignumber
 * @param {number} length -  The data length for hex conversion
 * @param {boolean} isUnsafe - If the data is a number that might be over the JS Safe integer, this should be true
 */
const hexEncode = (data, length, isUnsafe) => {
  let hex;
  if (typeof data === "number" || isUnsafe) {
    data = ethers.utils.bigNumberify(data);
    hex = ethers.utils.hexZeroPad(ethers.utils.hexlify(data), length);
    return hex;
  } else {
    const str = ethers.utils.hexlify(data);
    if (ethers.utils.hexDataLength(str) !== length)
      throw new Error("Uint8Array or hex string must be of exact length");
    hex = str;
    return hex;
  }
};

/**
 *
 * @param {number} txAmount - The tx amount
 * @param {number} lockedAmount - The tx locked amount
 * @param {string} locksRoot - The hexadecimal string of the locksroot
 */
const createBalanceHash = (txAmount, lockedAmount, locksRoot) => {
  const toHash = ethers.utils.concat([
    hexEncode(txAmount, 32),
    hexEncode(lockedAmount, 32),
    hexEncode(locksRoot, 32)
  ]);
  return ethers.utils.keccak256(toHash);
};

// TODO: Create an enum for the CMDID
// TODO: Create JSDOC for this method
// TODO: Create enum for message type
// TODO: Separate the methods and document their uses according to messages

export const getDataToSign = message => {
  const messageHashArray = ethers.utils.concat([
    hexEncode(7, 1), // CMDID, see python for details
    hexEncode(0, 3), // Padding of number
    hexEncode(message.nonce, 8),
    hexEncode(message.chain_id, 32),
    hexEncode(message.message_identifier, 8, true),
    hexEncode(message.payment_identifier, 8, true),
    hexEncode(0, 32), // payment_hash if it is 0x0
    hexEncode(message.lock.expiration, 32),
    hexEncode(message.token_network_address, 20),
    hexEncode(message.token, 20),
    hexEncode(message.channel_identifier, 32),
    hexEncode(message.recipient, 20),
    hexEncode(message.target, 20),
    hexEncode(message.initiator, 20),
    hexEncode(message.locksroot, 32),
    hexEncode(message.lock.secrethash, 32),
    hexEncode(message.transferred_amount, 32),
    hexEncode(message.locked_amount, 32),
    hexEncode(message.lock.amount, 32),
    hexEncode(message.fee, 32)
  ]);

  const messageHash = ethers.utils.keccak256(messageHashArray);

  const balanceHash = createBalanceHash(
    message.transferred_amount,
    message.locked_amount,
    message.locksroot
  );

  const dataArray = ethers.utils.concat([
    hexEncode(message.token_network_address, 20),
    hexEncode(message.chain_id, 32),
    hexEncode(1, 32), //Msg type (balance proof)
    hexEncode(message.channel_identifier, 32),
    hexEncode(balanceHash, 32), // balance hash
    hexEncode(message.nonce, 32),
    hexEncode(messageHash, 32) // additional hash
  ]);

  // dataArray is a byte array, this can be signed with an ethers wallet
  // signing it with an ethers wallet is equal as the method with python
  // Other methods like toString and using web3 and appending the prefix are untested
  return dataArray;
};
