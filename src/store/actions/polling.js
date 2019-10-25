import { MESSAGE_POLLING, MESSAGE_SENT } from "./types";
import client from "../../apiRest";

/**
 * @param {string} apiKey The API Key for the Lumino HUB.
 * @param {Array<String>} paymentList The paymentIDs to fetch
 * @returns {Array<Object>} Messages that were pulled from the Lumino HUB
 */
export const getMessages = (apiKey, paymentList) => dispatch => {
  // TODO: Implementation
  // ENDPOINT /api/payments_light OPERATION: POST
  // This function should be called every X time to pull all the messages of the HUB.
  // Then it will return the messages corresponding to those payments
  // The apiKey should be used in headers (x-api-key)
  // The body will be composed of an array of objects, which will be a key pair like this
  // const paymentList = {paymentId1: 1, paymentId2: 5}
  // body: { "messages_request": paymentList}
  // Those keys will be the payment ID and the offset of the message.
  // The hub will answer with an array of objects, those are like this
  // {
  //      "identifier": 587,
  //      "is_signed": false,
  //      "message_order": 0,
  //      "unsigned_message": {
  //          "type": "LockedTransfer",
  //          "chain_id": 33,
  //          "message_identifier": 6719523415987979539,
  //          "payment_identifier": 905138319682478303,
  //          "payment_hash_invoice": "0x",
  //          "nonce": 1,
  //          "token_network_address": "0x877ec5961d18d3413fabbd67696b758fe95408d6",
  //          "token": "0xff10e500973a0b0071e2263421e4af60425834a6",
  //          "channel_identifier": 1,
  //          "transferred_amount": 0,
  //          "locked_amount": 1000000000000000,
  //          "recipient": "0x29021129f5d038897f01bd4bc050525ca01a4758",
  //          "locksroot": "0x78c205b7ad996ae64ac37f3f79c2a7363e09de56e69b356edb3652e37c35553a",
  //          "lock": {
  //              "type": "Lock",
  //              "amount": 1000000000000000,
  //              "expiration": 1624776,
  //              "secrethash": "0x2947ad48b464ceb482736ef615cd8115deae0e117c4f42ac5085d3c52d16544b"
  //          },
  //          "target": "0x29021129f5d038897f01bd4bc050525ca01a4758",
  //          "initiator": "0x09fcbe7ceb49c944703b4820e29b0541edfe7e82",
  //          "fee": 0,
  //          "signature": "0x"
  //      },
  //      "signed_message": null,
  //      "state_change_id": null,
  //      "light_client_payment_id": 97
  //  }
  //
    // dispatch({
    //   type: MESSAGE_POLLING,
    //   data: RESPONSEDATA,
    // });
}

/**
 * @param {string} apiKey The API Key for the Lumino HUB.
 * @param {Array<Object>} messages Objects that have the data necessary to make put request to the HUB
 * @returns {void} Dispatches data to redux
 */
export const sendMessages = (apiKey, messages) => dispatch => {
  // OPERATION: PUT ENDPOINT:  /api/payments_light 
  // The apiKey should be used in headers (x-api-key)
  // These objects are constructed by us so this will just be a simple put request.
  // Each object is as follows
  // const data = {
  //   message_id: 1,
  //   message_order: 1,
  //   sender: "0x....",
  //   receiver: "0x....",
  //   message: messageData - An Object which is the following
  // const messageData = {
  //   message_id: 97,
  //   message_order: 0,
  //   sender: "0x09fcbe7cEb49c944703b4820e29b0541eDfE7E82",
  //   receiver: "0x29021129F5d038897f01bD4BC050525Ca01a4758",
  //   message: {
  //     type: "LockedTransfer",
  //     chain_id: 33,
  //     message_identifier: 6719523415987979539,
  //     payment_identifier: 905138319682478303,
  //     payment_hash_invoice: "0x",
  //     nonce: 1,
  //     token_network_address: "0x877ec5961d18d3413fabbd67696b758fe95408d6",
  //     token: "0xff10e500973a0b0071e2263421e4af60425834a6",
  //     channel_identifier: 1,
  //     transferred_amount: 0,
  //     locked_amount: 1000000000000000,
  //     recipient: "0x29021129f5d038897f01bd4bc050525ca01a4758",
  //     locksroot:
  //       "0x78c205b7ad996ae64ac37f3f79c2a7363e09de56e69b356edb3652e37c35553a",
  //     lock: {
  //       type: "Lock",
  //       amount: 1000000000000000,
  //       expiration: 1624776,
  //       secrethash:
  //         "0x2947ad48b464ceb482736ef615cd8115deae0e117c4f42ac5085d3c52d16544b",
  //     },
  //     target: "0x29021129f5d038897f01bd4bc050525ca01a4758",
  //     initiator: "0x09fcbe7ceb49c944703b4820e29b0541edfe7e82",
  //     fee: 0,
  //     signature:
  //       "0x302bb7809e6734809c38cc24122a41275ea116ff8a18c6e8454898ab012b2d25555dee72584a07960e53de91b2b2f3f3c04b7c4f9ea971af9da11b44fe1f3b791c",
  //   },
  // };

  // }
  // These will be constructed and passed in the messages array by a function before calling sendMessages, and will be passed as a param to this function
  // After getting an answer, the response should be dispatched with this function
  // With that data, we will process it again and finally return the result to the user


// dispatch({
//   type: MESSAGE_SENT,
//   data: RESPONSEDATA,
// });
}