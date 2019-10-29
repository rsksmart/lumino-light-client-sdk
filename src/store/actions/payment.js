import { CREATE_PAYMENT } from "./types";
import { CHANNEL_OPENED } from "../../config/channelStates";
import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";
import generateHashes from "../../utils/generateHashes";
import { getDataToSignForLockedTransfer } from "../../utils/pack";

/**
 * Create a payment.
 * @param {string} amount- Amount to pay
 * @param {string} address -  The address of the channel creator
 * @param {string} partner -  The partner address
 * @param {string} token_address -  The address of the lumino token
 */
export const createPayment = params => async (dispatch, getState, lh) => {
  // TODO: Try to store api_key through onboarding
  const api_key = "646c317ecf7961de641fef63a7d2c929f5d46b70";
  try {
    const { address, partner, token_address, amount } = params;
    const hashes = generateHashes();
    const { secrethash, secret } = hashes;
    const requestBody = {
      api_key,
      creator_address: address,
      partner_address: partner,
      amount,
      token_address,
      secrethash,
    };
    const urlCreate = "payments_light/create";
    const res = await client.post(
      urlCreate,
      {
        ...requestBody,
      },
      {
        headers: {
          "x-api-key": api_key,
        },
      }
    );
    const { message, message_id, message_order } = { ...res.data };
    const messageWithHash = {
      ...message,
      lock: {
        ...message.lock,
        secrethash,
      },
    };
    let signature;
    const dataToSign = getDataToSignForLockedTransfer(messageWithHash);
    try {
      signature = await resolver(dataToSign, lh, true);
    } catch (resolverError) {
      throw resolverError;
    }
    const dataToPut = {
      message_id,
      message_order,
      receiver: "0xA5157c2b6c16480b6a5808CfFf183D6c34A047C6", //messageWithHash.recipient,
      sender: "0xc19BBF5E4F1709230EBe2552dc15C692FE8DEf83", //messageWithHash.initiator,
      message: {
        ...messageWithHash,
        signature,
      },
    };
    const urlPut = "payments_light";
    const responsePut = await client.put(
      urlPut,
      {
        ...dataToPut,
      },
      {
        headers: {
          "x-api-key": api_key,
        },
      }
    );

    // TODO: Handle success on initiating the protocol.
    dispatch({
      type: CREATE_PAYMENT,
      payment: {
        ...res.data,
        message: finalMessage,
        sdk_status: CHANNEL_OPENED,
      },
    });
    const allData = getState();
    return await lh.storage.saveLuminoData(allData);
  } catch (apiError) {
    throw apiError;
  }
};
