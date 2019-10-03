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
    // TODO: return the request body in the data
    //   dispatch({
    //     type: MESSAGE_POLLING,
    //     data: ...res
    //   });
  } catch (error) {
    throw error;
  }
};
