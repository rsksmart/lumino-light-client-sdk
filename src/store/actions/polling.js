import { MESSAGE_POLLING } from "./types";
import client from "../../apiRest";

/**
 * Polling for messages
 * @param {number} offset - The message offset, so the HUB knows which messages to send
 * @param {string} apiKey -  Api key for the HUB
 */
export const messagePolling = (offset, apiKey) => async (
  dispatch,
  getState
) => {
  try {
    // NOTE: The big idea of this function is to pull messages from the HUB and dispatch those responses to redux
    // We will handle them and then send the correct responses

    // TODO: return the response data through the redux dispatch
    dispatch({
      type: MESSAGE_POLLING,
      data: "The response data",
    });
  } catch (error) {
    throw error;
  }
};
