import { CREATE_PAYMENT } from "./types";
import { CHANNEL_OPENED } from "../../config/channelStates";
import client from "../../apiRest";

/**
 * Create a payment.
 * @param {string} amount- Amount to pay
 * @param {string} address -  The address of the channel creator
 * @param {string} partner -  The partner address
 * @param {string} token_address -  The address of the lumino token
 */
export const createPayment = params => async (dispatch, getState, lh) => {
  try {
    const { address, partner, token_address, amount } = params;
    const requestBody = {
      api_key: "some",
      amount,
      creator_address: address,
      partner_address: partner,
      token_address
    };
    const url = "payments_light";
    const res = await client.post(
      url,
      { ...requestBody },
      {
        headers: {
          "x-api-key": "some"
        }
      }
    );
    dispatch({
      type: CREATE_PAYMENT,
      payment: { ...res.data, sdk_status: CHANNEL_OPENED }
    });
    const allData = getState();
    return await lh.storage.saveLuminoData(allData);
  } catch (apiError) {
    throw apiError;
  }
};
