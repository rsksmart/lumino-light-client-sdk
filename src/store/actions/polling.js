import { MESSAGE_POLLING } from "./types";
import client from "../../apiRest";

/**
 * Action that process the message
 * @param {object} message - A message pulled from a Lumino HUB
 */
export const processMessage = (message) => async (
  dispatch,
  getState
) => {
  try {
    // NOTE: The big idea of this function is to pull messages from the HUB and dispatch those responses to redux
    // We will handle them and then send the correct responses
    // Process the message...
    // TODO: return the response data through the redux dispatch (Pending discussion of handling these)
    dispatch({
      type: MESSAGE_POLLING,
      data: message,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @param {string} apiKey The API Key for the Lumino HUB.
 * @param {Array<String>} paymentList The paymentIDs to fetch
 * @returns {Array<Object>} Messages that were pulled from the Lumino HUB
 */
export const getMessages = (apiKey, paymentList) => {
  // TODO: Implementation
  // This function should be called every X time to pull all the messages of the HUB.
  // Then it will return the messages corresponding to those payments
}

/**
 * 
 * @param {Array<Object>} messages Objects that have the data necessary to make put request to the HUB
 * @returns {void} Dispatches data to redux
 */
export const sendMessages = (messages) => {
  // These objects are constructed by us so this will just be a simple put request.
  // Each object is as follows
  // const data = {
  //   message_id: 1,
  //   message_order: 1,
  //   sender: "0x....",
  //   receiver: "0x....",
  //   message: messageData
  // }
  // These will be constructed and passed in the mssages array


}