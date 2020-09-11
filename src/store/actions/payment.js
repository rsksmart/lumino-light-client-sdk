import { ethers } from "ethers";
import {
  CREATE_PAYMENT,
  ADD_PENDING_PAYMENT_MESSAGE,
  SET_PAYMENT_SECRET,
  UPDATE_NON_CLOSING_BP,
  PUT_LOCK_EXPIRED,
  SET_PAYMENT_FAILED,
  ADD_EXPIRED_PAYMENT_MESSAGE,
  PAYMENT_CREATION_ERROR,
  ADD_REFUNDED_PAYMENT_MESSAGE,
} from "./types";
import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";
import { isRnsDomain } from "../../utils/functions";
import generateHashes from "../../utils/generateHashes";
import {
  getDataToSignForLockedTransfer,
  getDataToSignForDelivered,
  getDataToSignForRevealSecret,
  getDataToSignForBalanceProof,
  getDataToSignForProcessed,
  getDataToSignForSecretRequest,
  getDataToSignForNonClosingBalanceProof,
  getDataToSignForLockExpired,
} from "../../utils/pack";
import {
  validateLockedTransfer,
  signatureRecover,
} from "../../utils/validators";
import {
  MessageType,
  PAYMENT_EXPIRED,
  PAYMENT_SUCCESSFUL,
  PAYMENT_REFUND,
} from "../../config/messagesConstants";
import { saveLuminoData } from "./storage";
import {
  getLatestChannelByPartnerAndToken,
  getChannelByIdAndToken,
} from "../functions/channels";
import {
  searchTokenDataInChannels,
  getTokenAddressByTokenNetwork,
} from "../functions/tokens";
import {
  getPaymentMessageTypeValue,
  getSenderAndReceiver,
} from "../functions/payments";
import { Lumino } from "../..";
import { CALLBACKS } from "../../utils/callbacks";
import { getRandomBN } from "../../utils/functions";
import { getRnsInstance } from "../functions/rns";

/**
 * Create a payment.
 * @param {string} amount- Amount to pay
 * @param {string} address -  The address of the channel creator
 * @param {string} partner -  The partner address or rns domain
 * @param {string} token_address -  The address of the lumino token
 */
export const createPayment = params => async (dispatch, getState, lh) => {
  let paymentData = {};
  try {
    const { getAddress, bigNumberify } = ethers.utils;
    const { token_address, amount, previousSecretHash } = params;
    let { partner } = params;
    const { address } = getState().client;
    const hashes = generateHashes();
    const { secrethash, hash: secret } = hashes;

    // Check if partner is a rns domain
    if (isRnsDomain(partner)) {
      const rns = getRnsInstance();
      partner = await rns.addr(partner);
      if (partner === "0x0000000000000000000000000000000000000000") {
        dispatch({
          type: PAYMENT_CREATION_ERROR,
          reason: "Selected RNS domain isnt registered`",
        });
        return null;
      }
    }

    paymentData = {
      token: token_address,
      partner,
      amount,
    };

    const channel = getLatestChannelByPartnerAndToken(partner, token_address);
    // Check for sufficient funds
    if (channel) {
      const actualBalance = bigNumberify(channel.offChainBalance);
      if (actualBalance.lt(amount))
        throw new Error("Insufficient funds for payment");
    }

    const requestBody = {
      creator_address: address,
      partner_address: partner,
      amount,
      token_address,
      secrethash,
    };

    // For refunded payments
    if (previousSecretHash) {
      requestBody.prev_secrethash = previousSecretHash;
    }
    
    const urlCreate = "payments_light/create";
    const res = await client.post(urlCreate, requestBody);
    const {
      message_content: { message, message_order, payment_id },
    } = { ...res.data };

    const messageWithHash = {
      ...message,
      lock: {
        ...message.lock,
        secrethash,
      },
    };
    let signature;
    const dataToSign = getDataToSignForLockedTransfer(messageWithHash);

    signature = await resolver(dataToSign, lh, true);
    const chId = message.channel_identifier;
    const tokenAddId = getAddress(message.token);
    const channelFromStore = getChannelByIdAndToken(chId, tokenAddId);
    const valid = validateLockedTransfer(
      message,
      requestBody,
      channelFromStore
    );
    if (valid !== true) throw valid;
    const dataToPut = {
      payment_id: payment_id,
      message_order,
      receiver: getAddress(messageWithHash.target),
      sender: getAddress(messageWithHash.initiator),
      message_type_value: PAYMENT_SUCCESSFUL,
      message: {
        ...messageWithHash,
        signature,
      },
    };

    // For refunded payments
    if (previousSecretHash) {
      dataToPut.additional_metadata = {
        previous_hash: previousSecretHash,
      };
    }

    const urlPut = "payments_light";
    // Send signed LT to HUB
    await client.put(urlPut, dataToPut);
    const { tokenName, tokenSymbol } = searchTokenDataInChannels(token_address);

    paymentData = {
      messages: { 1: { ...dataToPut, message_order: 1 } },
      message_order: 1,
      secret,
      partner: message.target,
      paymentId: payment_id,
      initiator: message.initiator,
      amount: message.lock.amount,
      secret_hash: secrethash,
      channelId: dataToPut.message.channel_identifier,
      token: token_address,
      tokenName,
      tokenSymbol,
      tokenNetworkAddress: dataToPut.message.token_network_address,
      chainId: dataToPut.message.chain_id,
    };
    // Recipient is present in mediated payments
    const { recipient } = dataToPut.message;
    if (recipient && recipient !== dataToPut.message.target) {
      paymentData.isMediated = true;
      paymentData.mediator = getAddress(recipient);
    }

    Lumino.callbacks.trigger(CALLBACKS.SENT_PAYMENT, paymentData);
    dispatch({
      type: CREATE_PAYMENT,
      payment: paymentData,
      paymentId: payment_id,
      channelId: dataToPut.message.channel_identifier,
      token: token_address,
    });
    const allData = getState();
    return await lh.storage.saveLuminoData(allData);
  } catch (error) {
    Lumino.callbacks.trigger(
      CALLBACKS.FAILED_CREATE_PAYMENT,
      paymentData,
      error
    );
  }
};

export const addPendingPaymentMessage = (
  paymentId,
  messageOrder,
  message
) => dispatch =>
  dispatch({
    type: ADD_PENDING_PAYMENT_MESSAGE,
    paymentId,
    messageOrder,
    message,
  });

export const addExpiredPaymentMessage = (
  paymentId,
  messageOrder,
  message,
  storeInMessages = false
) => dispatch =>
  dispatch({
    type: ADD_EXPIRED_PAYMENT_MESSAGE,
    paymentId,
    messageOrder,
    message,
    storeInMessages,
  });

export const addRefundPaymentMessage = (
  paymentId,
  messageOrder,
  message
) => dispatch =>
  dispatch({
    type: ADD_REFUNDED_PAYMENT_MESSAGE,
    paymentId,
    messageOrder,
    message,
  });

export const addExpiredPaymentNormalMessage = (
  paymentId,
  messageOrder,
  message
) => dispatch =>
  dispatch({
    type: ADD_EXPIRED_PAYMENT_MESSAGE,
    paymentId,
    messageOrder,
    message,
    storeInMessages: true,
  });

const nonSuccessfulMessageAdd = data => dispatch => {
  const {
    paymentId,
    order,
    message,
    message_type_value,
    storeInMessages,
  } = data;
  switch (message_type_value) {
    case PAYMENT_EXPIRED: {
      return dispatch(
        addExpiredPaymentMessage(
          paymentId,
          order,
          {
            message,
            message_order: order,
          },
          storeInMessages
        )
      );
    }
    case PAYMENT_REFUND: {
      return dispatch(
        addRefundPaymentMessage(
          paymentId,
          order,
          {
            message,
            message_order: order,
          },
          storeInMessages
        )
      );
    }
  }
};

export const putDelivered = (
  message,
  payment,
  order = 4,
  storeInMessages = false
) => async (dispatch, getState, lh) => {
  // We determine the type for failures or success flows
  const message_type_value = getPaymentMessageTypeValue(payment);
  const { sender, receiver } = getSenderAndReceiver(payment, order);
  const { getAddress } = ethers.utils;
  const { paymentId } = payment;

  const body = {
    payment_id: paymentId,
    message_order: order,
    sender: getAddress(sender),
    receiver: getAddress(receiver),
    message_type_value: message_type_value,
    message: {
      type: MessageType.DELIVERED,
      delivered_message_identifier: message.message_identifier,
    },
  };
  const dataToSign = getDataToSignForDelivered(body.message);
  let signature = "";

  signature = await resolver(dataToSign, lh, true);

  body.message.signature = signature;
  try {
    if (message_type_value !== PAYMENT_SUCCESSFUL) {
      const data = {
        paymentId,
        order,
        message: body.message,
        message_type_value,
        storeInMessages,
      };
      dispatch(nonSuccessfulMessageAdd(data));
    } else {
      dispatch(
        addPendingPaymentMessage(payment.paymentId, body.message_order, {
          message: body.message,
          message_order: body.message_order,
        })
      );
    }
    const urlPut = "payments_light";
    await client.put(urlPut, body);

    dispatch(saveLuminoData());
  } catch (reqEx) {
    console.error("reqExDelivered", reqEx);
  }
};

export const putProcessed = (
  msg,
  payment,
  order = 3,
  storeInMessages = false
) => async (dispatch, getState, lh) => {
  const { sender, receiver } = getSenderAndReceiver(payment);
  const message_type_value = getPaymentMessageTypeValue(payment);
  const { paymentId } = payment;
  const body = {
    payment_id: payment.paymentId,
    message_order: order,
    sender,
    receiver,
    message_type_value: message_type_value,
    message: {
      type: MessageType.PROCESSED,
      message_identifier: msg.message_identifier,
    },
  };
  const dataToSign = getDataToSignForProcessed(body.message);
  let signature = "";

  signature = await resolver(dataToSign, lh, true);

  body.message.signature = signature;
  try {
    if (message_type_value !== PAYMENT_SUCCESSFUL) {
      const data = {
        paymentId,
        order,
        message: body.message,
        message_type_value,
        storeInMessages,
      };
      dispatch(nonSuccessfulMessageAdd(data));
    } else {
      dispatch(
        addPendingPaymentMessage(paymentId, order, {
          message: body.message,
          message_order: order,
        })
      );
    }
    const urlPut = "payments_light";
    await client.put(urlPut, body);
    dispatch(saveLuminoData());
  } catch (reqEx) {
    console.error("reqEx Put Processed", reqEx);
  }
};

export const putSecretRequest = (msg, payment) => async (
  dispatch,
  getState,
  lh
) => {
  const { sender, receiver } = getSenderAndReceiver(payment, 5);

  const body = {
    payment_id: payment.paymentId,
    message_order: 5,
    sender,
    receiver,
    message_type_value: PAYMENT_SUCCESSFUL,
    message: {
      type: MessageType.SECRET_REQUEST,
      message_identifier: msg.message_identifier,
      payment_identifier: payment.paymentId,
      amount: payment.amount,
      expiration: msg.expiration,
      secrethash: payment.secret_hash,
    },
  };
  const dataToSign = getDataToSignForSecretRequest(body.message);
  let signature = "";

  signature = await resolver(dataToSign, lh, true);

  body.message.signature = signature;
  try {
    dispatch(
      addPendingPaymentMessage(payment.paymentId, body.message_order, {
        message: body.message,
        message_order: body.message_order,
      })
    );
    const urlPut = "payments_light";
    await client.put(urlPut, body);
    dispatch(saveLuminoData());
  } catch (reqEx) {
    console.error("reqEx Put SecretRequest", reqEx);
  }
};

export const putRevealSecret = (
  payment,
  message_identifier = getRandomBN(),
  order = 7
) => async (dispatch, getState, lh) => {
  const { sender, receiver } = getSenderAndReceiver(payment, order);
  const body = {
    payment_id: payment.paymentId,
    message_order: order,
    sender,
    receiver,
    message_type_value: PAYMENT_SUCCESSFUL,
    message: {
      type: MessageType.REVEAL_SECRET,
      message_identifier,
      secret: payment.secret,
    },
  };
  const dataToSign = getDataToSignForRevealSecret(body.message);
  let signature = "";

  signature = await resolver(dataToSign, lh, true);

  body.message.signature = signature;
  try {
    dispatch(
      addPendingPaymentMessage(payment.paymentId, body.message_order, {
        message: body.message,
        message_order: body.message_order,
      })
    );
    const urlPut = "payments_light";
    await client.put(urlPut, body);
    dispatch(saveLuminoData());
  } catch (reqEx) {
    console.error("reqEx Put RevealSecret", reqEx);
  }
};

export const putBalanceProof = (message, payment) => async (
  dispatch,
  getState,
  lh
) => {
  const { sender, receiver } = getSenderAndReceiver(payment, 11);
  const dataToSign = getDataToSignForBalanceProof(message);
  let signature = "";

  signature = await resolver(dataToSign, lh, true);
  const body = {
    payment_id: payment.paymentId,
    message_order: 11,
    sender,
    receiver,
    message_type_value: PAYMENT_SUCCESSFUL,
    message: {
      ...message,
      signature,
    },
  };
  try {
    dispatch(
      addPendingPaymentMessage(payment.paymentId, body.message_order, {
        message: body.message,
        message_order: body.message_order,
      })
    );
    const urlPut = "payments_light";
    await client.put(urlPut, body);
    dispatch(saveLuminoData());
  } catch (reqEx) {
    console.error("reqEx Put BalanceProof", reqEx);
  }
};

export const putNonClosingBalanceProof = (message, payment) => async (
  dispatch,
  getState,
  lh
) => {
  const { getAddress } = ethers.utils;
  const dataToSign = getDataToSignForNonClosingBalanceProof(message);
  let signature = "";
  signature = await resolver(dataToSign, lh, true);
  const body = {
    sender: getAddress(payment.partner),
    light_client_payment_id: payment.paymentId,
    secret_hash: payment.secret_hash,
    nonce: message.nonce,
    channel_id: payment.channelId,
    token_network_address: getAddress(payment.tokenNetworkAddress),
    lc_bp_signature: signature,
    partner_balance_proof: message,
  };
  try {
    const urlPut = "watchtower";
    await client.put(urlPut, body);
    dispatch({
      type: UPDATE_NON_CLOSING_BP,
      channelId: payment.channelId,
      token: getAddress(payment.token),
      nonClosingBp: body,
    });
    dispatch(saveLuminoData());
  } catch (reqEx) {
    console.error("reqEx Put NonClosingBP", reqEx);
  }
};

export const setPaymentSecret = (paymentId, secret) => ({
  type: SET_PAYMENT_SECRET,
  secret,
  paymentId,
});

export const setPaymentFailed = (paymentId, state, reason) => dispatch => {
  const obj = {
    type: SET_PAYMENT_FAILED,
    paymentId,
    reason,
    paymentState: state,
  };
  return dispatch(obj);
};

/**
 *
 * @param {*} data Data of the payment and message for the request
 */
export const putLockExpired = data => async (dispatch, getState, lh) => {
  try {
    const { sender, receiver } = getSenderAndReceiver(data);

    if (!sender || !receiver) return null;
    const body = {
      payment_id: data.paymentId,
      message_order: 1,
      sender,
      receiver,
      message_type_value: PAYMENT_EXPIRED,
      message: {
        type: MessageType.LOCK_EXPIRED,
        chain_id: data.chainId,
        nonce: data.nonce,
        token_network_address: data.tokenNetworkAddress,
        message_identifier: data.message_identifier,
        channel_identifier: data.channelId,
        secrethash: data.secret_hash,
        transferred_amount: data.transferred_amount,
        locked_amount: data.locked_amount,
        recipient: receiver,
        locksroot: data.locksroot,
      },
    };
    if (data.signature && data.signature !== "0x")
      return dispatch({
        type: PUT_LOCK_EXPIRED,
        paymentId: data.paymentId,
        lockExpired: body,
      });

    const dataToSign = getDataToSignForLockExpired(body.message);
    const signature = await resolver(dataToSign, lh, true);
    body.message.signature = signature;
    const urlPut = "payments_light";
    await client.put(urlPut, body);
    dispatch({
      type: PUT_LOCK_EXPIRED,
      paymentId: data.paymentId,
      lockExpired: body,
    });
    dispatch(saveLuminoData());
  } catch (error) {
    console.error("Error in put LockExpired: ", error);
  }
};

export const recreatePaymentForFailure = data => (dispatch, getState) => {
  const { address } = getState().client;
  const { getAddress } = ethers.utils;
  const initiator = signatureRecover(data);
  const tokenNetworkAddress = getAddress(data.token_network_address);
  const tokenAddress = getTokenAddressByTokenNetwork(tokenNetworkAddress);

  dispatch({
    type: CREATE_PAYMENT,
    payment: {
      partner: address,
      paymentId: data.payment_id,
      isReceived: true,
      initiator,
      amount: data.transferred_amount,
      token: tokenAddress,
      channelId: data.channel_identifier,
      tokenNetworkAddress: data.token_network_address,
      chainId: data.chain_id,
    },
    paymentId: data.payment_id,
    channelId: data.channel_identifier,
    token: tokenAddress,
  });
};
