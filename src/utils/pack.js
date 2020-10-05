import { ethers } from "ethers";
import {
  MessageNumPad,
  MessageType,
  MessageTypeID,
} from "../config/messagesConstants";

/**
 * Encodes data to a correct hex format
 * @param {any} data - string/number/bignumber
 * @param {number} length -  The data length for hex conversion
 * @param {boolean} isUnsafe - If the data is a number that might be over the JS Safe integer, this should be true
 */
export const hexEncode = (data, length, isUnsafe) => {
  let hex;
  if (typeof data === "number" || isUnsafe) {
    data = ethers.utils.bigNumberify(`${data}`);
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
export const createBalanceHash = (txAmount, lockedAmount, locksRoot) => {
  const { HashZero } = ethers.constants;
  const txAmountHex = hexEncode(txAmount, 32, true);
  const lockedAmountHex = hexEncode(lockedAmount, 32, true);
  const locksRootHex = hexEncode(locksRoot, 32);
  // We check for the 0 hash
  if (
    locksRootHex === HashZero &&
    lockedAmountHex === HashZero &&
    txAmountHex === HashZero
  )
    return HashZero;
  const toHash = ethers.utils.concat([
    txAmountHex,
    lockedAmountHex,
    locksRootHex,
  ]);
  return ethers.utils.keccak256(toHash);
};

export const createMessageHash = (data, type = MessageType.BALANCE_PROOF) => {
  const messageHashUnhashed = ethers.utils.concat([
    hexEncode(MessageNumPad[type], 1),
    hexEncode(0, 3),
    hexEncode(data.chain_id, 32),
    hexEncode(data.message_identifier, 8, true),
    hexEncode(data.payment_identifier, 8, true),
    hexEncode(data.token_network_address, 20),
    hexEncode(data.secret, 32),
    hexEncode(data.nonce, 8),
    hexEncode(data.channel_identifier, 32),
    hexEncode(data.transferred_amount, 32, true),
    hexEncode(data.locked_amount, 32, true),
    hexEncode(data.locksroot, 32),
  ]);

  return ethers.utils.keccak256(messageHashUnhashed);
};

// TODO: Separate the methods and document their uses according to messages

export const getDataToSignForLockedTransfer = (
  message,
  messageTypeId = MessageTypeID.BALANCE_PROOF
) => {
  const messageHashArray = ethers.utils.concat([
    hexEncode(MessageNumPad[MessageType.LOCKED_TRANSFER], 1), // CMDID, as in the python implementation
    hexEncode(0, 3), // Padding
    hexEncode(message.nonce, 8),
    hexEncode(message.chain_id, 32),
    hexEncode(message.message_identifier, 8, true),
    hexEncode(message.payment_identifier, 8, true),
    hexEncode(0, 32), // payment_hash if it is 0x0, we are doing it with 0x0 for the moment which is 0
    hexEncode(message.lock.expiration, 32, true),
    hexEncode(message.token_network_address, 20),
    hexEncode(message.token, 20),
    hexEncode(message.channel_identifier, 32),
    hexEncode(message.recipient, 20),
    hexEncode(message.target, 20),
    hexEncode(message.initiator, 20),
    hexEncode(message.locksroot, 32),
    hexEncode(message.lock.secrethash, 32),
    hexEncode(message.transferred_amount, 32, true),
    hexEncode(message.locked_amount, 32, true),
    hexEncode(message.lock.amount, 32, true),
    hexEncode(message.fee, 32),
  ]);

  const messageHash = ethers.utils.keccak256(messageHashArray);

  const balanceHash = createBalanceHash(
    message.transferred_amount,
    message.locked_amount,
    message.locksroot
  );

  let dataArrayBase = [
    hexEncode(message.token_network_address, 20),
    hexEncode(message.chain_id, 32),
    hexEncode(messageTypeId, 32), //Msg type (balance proof)
    hexEncode(message.channel_identifier, 32),
    hexEncode(balanceHash, 32), // balance hash
    hexEncode(message.nonce, 32),
    hexEncode(messageHash, 32), // additional hash
  ];
  if (messageTypeId === MessageTypeID.UPDATE_BALANCE_PROOF) {
    dataArrayBase.push(message.signature);
  }
  const dataArray = ethers.utils.concat(dataArrayBase);

  // dataArray is a byte array, this can be signed with an ethers wallet
  // signing it with an ethers wallet is equal as the method with python
  return ethers.utils.arrayify(dataArray);
};

export const getDataToSignForDelivered = message => {
  return ethers.utils.concat([
    hexEncode(MessageNumPad[MessageType.DELIVERED], 1),
    hexEncode(0, 3),
    hexEncode(message.delivered_message_identifier, 8, true),
  ]);
};

export const getDataToSignForProcessed = message => {
  return ethers.utils.concat([
    hexEncode(MessageNumPad[MessageType.PROCESSED], 1),
    hexEncode(0, 3),
    hexEncode(message.message_identifier, 8, true),
  ]);
};

// INFO: This is also used for secret, the BP is a response a to a "Secret" message
export const getDataToSignForBalanceProof = (
  message,
  type = MessageType.BALANCE_PROOF
) => {
  const messageHash = createMessageHash(message, type);

  const balanceHash = createBalanceHash(
    message.transferred_amount,
    message.locked_amount,
    message.locksroot
  );

  const BPType = type === MessageType.BALANCE_PROOF ? 1 : 2;

  const dataToSign = ethers.utils.concat([
    hexEncode(message.token_network_address, 20),
    hexEncode(message.chain_id, 32),
    hexEncode(BPType, 32), // Balance Proof or Update Balance Proof
    hexEncode(message.channel_identifier, 32),
    hexEncode(balanceHash, 32), // balance hash
    hexEncode(message.nonce, 32),
    hexEncode(messageHash, 32), // additional hash
  ]);
  return dataToSign;
};

export const getDataToSignForNonClosingBalanceProof = (
  message,
  isLT = false
) => {
  const msgType = isLT ? MessageType.BALANCE_PROOF : "UPDATE_BALANCE_PROOF";
  const bpData = getDataToSignForBalanceProof(message, msgType);
  const dataToSign = ethers.utils.concat([bpData, message.signature]);
  return dataToSign;
};

export const getDataToSignForRevealSecret = message => {
  return ethers.utils.concat([
    hexEncode(MessageNumPad[MessageType.REVEAL_SECRET], 1),
    hexEncode(0, 3),
    hexEncode(message.message_identifier, 8, true),
    hexEncode(message.secret, 32),
  ]);
};

export const getDataToSignForSecretRequest = message => {
  return ethers.utils.concat([
    hexEncode(MessageNumPad[MessageType.SECRET_REQUEST], 1),
    hexEncode(0, 3),
    hexEncode(message.message_identifier, 8, true),
    hexEncode(message.payment_identifier, 8, true),
    hexEncode(message.secrethash, 32),
    hexEncode(message.amount, 32, true),
    hexEncode(message.expiration, 32, true),
  ]);
};

export const getDataToSignForLockExpired = message => {
  const messageHashUnhashed = ethers.utils.concat([
    hexEncode(MessageNumPad[MessageType.LOCK_EXPIRED], 1),
    hexEncode(0, 3),
    hexEncode(message.nonce, 8),
    hexEncode(message.chain_id, 32),
    hexEncode(message.message_identifier, 8, true),
    hexEncode(message.token_network_address, 20),
    hexEncode(message.channel_identifier, 32),
    hexEncode(message.recipient, 20),
    hexEncode(message.locksroot, 32),
    hexEncode(message.secrethash, 32),
    hexEncode(message.transferred_amount, 32, true),
    hexEncode(message.locked_amount, 32, true),
  ]);

  const messageHash = ethers.utils.keccak256(messageHashUnhashed);

  const balanceHash = createBalanceHash(
    message.transferred_amount,
    message.locked_amount,
    message.locksroot
  );

  const BPType = 1;

  const dataToSign = ethers.utils.concat([
    hexEncode(message.token_network_address, 20),
    hexEncode(message.chain_id, 32),
    hexEncode(BPType, 32), // Balance Proof Num
    hexEncode(message.channel_identifier, 32),
    hexEncode(balanceHash, 32), // balance hash
    hexEncode(message.nonce, 32),
    hexEncode(messageHash, 32), // additional hash
  ]);
  return dataToSign;
};

export const getPackedData = message => {
  const { type } = message;
  switch (type) {
    case MessageType.DELIVERED:
      return getDataToSignForDelivered(message);
    case MessageType.PROCESSED:
      return getDataToSignForProcessed(message);
    case MessageType.LOCKED_TRANSFER:
      return getDataToSignForLockedTransfer(message);
    case MessageType.SECRET_REQUEST:
      return getDataToSignForSecretRequest(message);
    case MessageType.REVEAL_SECRET:
      return getDataToSignForRevealSecret(message);
    case MessageType.SECRET:
      return getDataToSignForBalanceProof(message);
    case MessageType.LOCK_EXPIRED:
      return getDataToSignForLockExpired(message);
    default:
      return null;
  }
};
