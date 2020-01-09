import { ethers } from "ethers";
import { notifierOperations } from "../../notifierRest";
import resolver from "../../utils/handlerResolver";
import {
  SET_NOTIFIER_API_KEY,
  NEW_NOTIFIER,
  SUBSCRIBED_TO_NEW_TOPIC,
  UNSUBSCRIBE_FROM_TOPIC,
  SET_LAST_NOTIFICATION_ID,
  OPEN_CHANNEL,
  START_NOTIFICATIONS_POLLING,
} from "./types";
import { saveLuminoData } from "./storage";
import { findMaxBlockId } from "../../utils/functions";
import { getChannelByIdAndToken } from "../functions";
import { getTokenAddressByTokenNetwork } from "../functions/tokens";
import { requestTokenAddressFromTokenNetwork } from "./tokens";
import Store from "..";

export const notifierRegistration = url => async (dispatch, getState, lh) => {
  try {
    const { address } = getState().client;
    const signedAddress = await resolver(address, lh, true);
    const endpoint = "users";
    notifierOperations.defaults.baseURL = url;
    const res = await notifierOperations.post(endpoint, signedAddress, {
      headers: {
        "content-type": "text/plain",
      },
      params: {
        address,
      },
    });
    if (res && res.data) {
      const { apiKey } = res.data.data;
      if (apiKey) {
        dispatch({
          type: NEW_NOTIFIER,
          notifierApiKey: apiKey,
          notifierUrl: url,
        });
        dispatch(saveLuminoData());
      }
      const urlSubscription = "subscribe";
      await notifierOperations.post(urlSubscription, null, {
        headers: { apiKey },
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const subscribeToOpenChannel = url => async (dispatch, getState, lh) => {
  try {
    const { address } = getState().client;
    const notifier = getState().notifier.notifiers[url];
    if (!notifier) return console.error(`Notifier ${url} not registered!`);
    const { apiKey } = notifier;
    if (!apiKey)
      return console.error(`API Key not present for notifier ${url}`);

    const endpoint = "subscribeToLuminoOpenChannels";
    notifierOperations.defaults.baseURL = url;
    const res = await notifierOperations.post(endpoint, null, {
      headers: {
        apiKey,
      },
      params: {
        participanttwo: address,
      },
    });
    const topics = processSubscribe(res);
    if (topics.length) {
      topics.forEach(({ topicId }) =>
        dispatch({
          type: SUBSCRIBED_TO_NEW_TOPIC,
          topicId,
          notifierUrl: url,
        })
      );
      dispatch({ type: START_NOTIFICATIONS_POLLING });
    }
  } catch (error) {
    console.error(error);
    const topics = processSubscribe(error.response);
    if (topics.length)
      topics.forEach(({ topicId }) =>
        dispatch({ type: SUBSCRIBED_TO_NEW_TOPIC, topicId, notifierUrl: url })
      );
    dispatch({ type: START_NOTIFICATIONS_POLLING });
  }
};

export const subscribeToCloseChannel = url => {};

const processSubscribe = res => {
  if (!res.data) return null;
  const { data } = res.data;
  return JSON.parse(String(data));
};

export const getNotifications = url => async (dispatch, getState, lh) => {
  try {
    // const { data } = res.data;
    // if (data && data.length) {
    //   const actions = data.map(async e => manageNotificationData(e, dispatch));
    //   const lastId = findMaxBlockId(data);
    //   dispatch({ type: SET_LAST_NOTIFICATION_ID, id: lastId });
    //   actions.forEach(e => {
    //     if (e) dispatch(e);
    //   });
    // }
  } catch (error) {
    console.error(error);
  }
};

export const unsubscribeFromTopic = (url, idTopic) => async (
  dispatch,
  getState,
  lh
) => {
  try {
    const { notifierApiKey } = getState().client;
    const url = "unsubscribeFromTopic";
    await notifier.post(url, null, {
      headers: {
        apiKey: notifierApiKey,
      },
      params: {
        idTopic,
      },
    });
    dispatch({ type: UNSUBSCRIBE_FROM_TOPIC, idTopic });
  } catch (error) {
    console.error(error);
  }
};

export const manageNotificationData = async notificationData => {
  const notification = JSON.parse(notificationData.info);
  const { eventName } = notification;
  switch (eventName) {
    case events.CHANNEL_OPENED:
      const newChannel = await createNewChannel(notification);
      return newChannel;
    default:
      return null;
  }
};

const createNewChannel = async notification => {
  const { getAddress } = ethers.utils;
  const { values, contractAddress } = notification;
  const token_network_identifier = getAddress(contractAddress);
  let token_address = getTokenAddressByTokenNetwork(token_network_identifier);
  const channel_identifier = values[0].value;
  // If the token is not in the map, we will request it
  let existingChannel = getChannelByIdAndToken(
    channel_identifier,
    token_address
  );
  if (existingChannel) return null;
  if (!token_address) {
    token_address = await Store.getStore().dispatch(
      requestTokenAddressFromTokenNetwork(token_network_identifier)
    );
  }
  const newChannel = {
    channel_identifier,
    partner_address: getAddress(values[1].value),
    settle_timeout: values[3].value,
    token_address,
    balance: "0",
    state: "opened",
    total_deposit: "0",
    reveal_timeout: "50",
    token_network_identifier,
  };
  // Do not return a new channel for one that is already opened

  existingChannel = getChannelByIdAndToken(channel_identifier, token_address);
  if (existingChannel || !token_address) return null;
  return {
    type: OPEN_CHANNEL,
    channel: newChannel,
  };
};

const events = {
  CHANNEL_OPENED: "ChannelOpened",
};
