import {ethers} from 'ethers';

/**
 * Encodes data to an appropiate hex format
 * @param {any} data - string/number/bignumber
 * @param {number} length -  The data length for hex conversion
 * @param {boolean} isUnsafe - If the data is a number that might be over the JS Safe integer, this should be true
 */
const hexEncode = (data, length, isUnsafe) => {
  let hex;
  if (typeof data === 'number' || isUnsafe) {
    data = ethers.utils.bigNumberify(data);
    hex = ethers.utils.hexZeroPad(ethers.utils.hexlify(data), length);
    return hex;
  } else {
    const str = ethers.utils.hexlify(data);
    if (ethers.utils.hexDataLength(str) !== length)
      throw new Error('Uint8Array or hex string must be of exact length');
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
    hexEncode(locksRoot, 32),
  ]);
  return ethers.utils.keccak256(toHash);
};

// Example of usage

//   const m = {
//     type: 'LockedTransfer',
//     chain_id: 33,
//     message_identifier: '12248562144413481135',
//     payment_identifier: '11640634370223461850',
//     payment_hash_invoice: '0x',
//     nonce: 1,
//     token_network_address: '0x877ec5961d18d3413fabbd67696b758fe95408d6',
//     token: '0xff10e500973a0b0071e2263421e4af60425834a6',
//     channel_identifier: 1,
//     transferred_amount: 0,
//     locked_amount: 100000000000000,
//     recipient: '0x29021129f5d038897f01bd4bc050525ca01a4758',
//     locksroot:
//       '0x3985b475b7e3af72cdbcd2e41b22951c168b0e2ff41bcc9548ee98d14ec86784',
//     lock: {
//       type: 'Lock',
//       amount: 100000000000000,
//       expiration: 195730,
//       secrethash:
//         '0x3e6d58ba381898cf1a0ff6fbe65a3805419063ea9eb6ff6bc6f0dde45032d0dc',
//     },
//     target: '0x29021129f5d038897f01bd4bc050525ca01a4758',
//     initiator: '0x09fcbe7ceb49c944703b4820e29b0541edfe7e82',
//     fee: 0,
//     signature:
//       '0x68b12d6de97e2be66a5d013a7118264ab696a45ebe7f9ef590c88286ba7804154e0a1418d78712d4aa227c33af23ebae2ff8114a7e3f3d9efb7e342235eba5941b',
//   };
//   let packed;
//   let balanceHash;
//   let messageHash;

//     messageHashArray = ethers.utils.concat([
//       hexEncode(7, 1),
//       hexEncode(0, 3),
//       hexEncode(m.nonce, 8),
//       hexEncode(m.chain_id, 32),
//       hexEncode(m.message_identifier, 8, true),
//       hexEncode(m.payment_identifier, 8, true),
//       hexEncode(0, 32),
//       hexEncode(m.lock.expiration, 32),
//       hexEncode(m.token_network_address, 20),
//       hexEncode(m.token, 20),
//       hexEncode(m.channel_identifier, 32),
//       hexEncode(m.recipient, 20),
//       hexEncode(m.target, 20),
//       hexEncode(m.initiator, 20),
//       hexEncode(m.locksroot, 32),
//       hexEncode(m.lock.secrethash, 32),
//       hexEncode(m.transferred_amount, 32),
//       hexEncode(m.locked_amount, 32),
//       hexEncode(m.lock.amount, 32),
//       hexEncode(m.fee, 32),
//     ]);

//     messageHash = ethers.utils.keccak256(messageHashArray);

//     balanceHash = createBalanceHash(
//       m.transferred_amount,
//       m.locked_amount,
//       m.locksroot,
//     );

//     const dataToPack = ethers.utils.concat([
//       hexEncode(m.token_network_address, 20),
//       hexEncode(m.chain_id, 32),
//       hexEncode(1, 32), //Msg type (balance proof)
//       hexEncode(m.channel_identifier, 32),
//       hexEncode(balanceHash, 32), // balance hash
//       hexEncode(m.nonce, 32),
//       hexEncode(messageHash, 32), // additional hash
//     ]);
//     packed = ethers.utils.hexlify(dataToPack);
