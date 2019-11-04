import { CREATE_PAYMENT, ADD_PAYMENT_MESSAGE } from "./types";
import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";
import generateHashes from "../../utils/generateHashes";
import { getDataToSignForLockedTransfer } from "../../utils/pack";
import { validateLockedTransfer } from "../../utils/validators";
import { messageManager } from "../../utils/messageManager";
import { getChannelsState } from "../functions";

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
    // TODO: Remove the hardcoded test channel id
    const channels = getChannelsState();
    validateLockedTransfer(message, requestBody, channels);
    const dataToPut = {
      message_id,
      message_order,
      receiver: "0xA5157c2b6c16480b6a5808CfFf183D6c34A047C6", // HACK: Checksummed messageWithHash.recipient,
      sender: "0xc19BBF5E4F1709230EBe2552dc15C692FE8DEf83", // HACK: Checksummed messageWithHash.initiator,
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
    if (!responsePut.data === "Should respond accordly to the message received")
      throw new Error("Something happened when putting LT");
    dispatch({
      type: CREATE_PAYMENT,
      payment: { ...dataToPut, message_order: 1 },
      paymentId: `${dataToPut.identifier}`,
      channelId: dataToPut.message.channel_identifier,
    });
    const allData = getState();
    return await lh.storage.saveLuminoData(allData);
  } catch (apiError) {
    throw apiError;
  }
};

export const mockGetMessages = () => async (dispatch, getState) => {
  try {
    // Here we get a message, as of now we mock it
    const data = {
      message_id: 24,
      message_order: 2,
      identifier: 587,
      receiver: "0xA5157c2b6c16480b6a5808CfFf183D6c34A047C6",
      sender: "0xc19BBF5E4F1709230EBe2552dc15C692FE8DEf83",
      message: {
        type: "Delivered",
        delivered_message_identifier: 123143,
        signature:
          "0xda4e24f32446047c611b755f0be6cac2ccf20f4ec1ae73a7cc5bf0b4a93566eb58b36699b8d0bdb17070de43cecb62abfd3e59c5b5d93da5e6be26dc40382ada1c",
        _type: "raiden.messages.Delivered",
        _version: 0,
      },
    };
    messageManager([data]);
  } catch (error) {
    throw error;
  }
};

export const addPaymentMessage = (
  paymentId,
  messageOrder,
  message
) => dispatch =>
  dispatch({
    type: ADD_PAYMENT_MESSAGE,
    paymentId,
    messageOrder,
    message,
  });
