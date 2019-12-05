import { ethers } from "ethers";
import notifier from "../../notifierRest";
import resolver from "../../utils/handlerResolver";
import {
  SET_NOTIFIER_API_KEY,
  SUBSCRIBED_TO_NEW_TOPIC,
  UNSUBSCRIBE_FROM_TOPIC,
  SET_LAST_NOTIFICATION_ID,
  OPEN_CHANNEL,
} from "./types";
import { saveLuminoData } from "./storage";
import { findMaxBlockId } from "../../utils/functions";
import { getChannelByIdAndToken } from "../functions";

export const notifierRegistration = () => async (dispatch, getState, lh) => {
  try {
    const { address } = getState().client;
    const signedAddress = await resolver(address, lh, true);
    const url = "users";
    const res = await notifier.post(url, signedAddress, {
      headers: {
        "content-type": "text/plain",
      },
      params: {
        address,
      },
    });
    const { apiKey } = res.data.data;
    if (apiKey) {
      dispatch({ type: SET_NOTIFIER_API_KEY, notifierApiKey: apiKey });
      dispatch(saveLuminoData());
    }
    const urlSubscription = "subscribe";
    await notifier.post(urlSubscription, null, {
      headers: { apiKey },
    });
  } catch (error) {
    console.error(error);
  }
};

export const subscribeToOpenChannel = () => async (dispatch, getState, lh) => {
  try {
    const { address, notifierApiKey } = getState().client;
    const url = "subscribeToLuminoOpenChannels";
    const res = await notifier.post(url, null, {
      headers: {
        apiKey: notifierApiKey,
      },
      params: {
        participanttwo: address,
      },
    });
    const topics = processSubscribeToOpen(res);
    if (topics.length)
      topics.forEach(({ topicId }) =>
        dispatch({ type: SUBSCRIBED_TO_NEW_TOPIC, topicId })
      );
  } catch (error) {
    console.error(error);
    const topics = processSubscribeToOpen(error.response);
    if (topics.length)
      topics.forEach(({ topicId }) =>
        dispatch({ type: SUBSCRIBED_TO_NEW_TOPIC, topicId })
      );
  }
};

const processSubscribeToOpen = res => {
  const { data } = res.data;
  return JSON.parse(String(data));
};

export const getNotifications = () => async (dispatch, getState, lh) => {
  try {
    const { notifierApiKey } = getState().client;
    const url = "getNotifications";
    const topics = Object.keys(getState().notifier).join(",");
    const res = await notifier.get(url, {
      headers: {
        apiKey: notifierApiKey,
      },
      params: {
        idTopic: topics,
        lastRows: 5,
      },
    });
    const { data } = res.data;
    if (data && data.length) {
      const processed = data.map(e => manageNotificationData(e));
      const lastId = findMaxBlockId(data);
      dispatch({ type: SET_LAST_NOTIFICATION_ID, id: lastId });
      processed.forEach(a => {
        if (a) dispatch(a);
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const unsubscribeFromTopic = idTopic => async (
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
    console.log("Dispatch unsubscribe");
  } catch (error) {
    console.error(error);
  }
};

const manageNotificationData = notificationData => {
  const notification = JSON.parse(notificationData.data);
  const { eventName } = notification;
  switch (eventName) {
    case events.CHANNEL_OPENED:
      return createNewChannel(notification);
    default:
      return null;
  }
};

const createNewChannel = notification => {
  const { getAddress } = ethers.utils;
  const { values, contractAddress } = notification;
  const newChannel = {
    channel_identifier: values[0].value,
    partner_address: getAddress(values[1].value),
    settle_timeout: values[3].value,
    token_address: getAddress("0xbdd48360077a542b57f2c67b8aa3AB86AfD30167"),
    balance: "0",
    state: "opened",
    total_deposit: "0",
    reveal_timeout: "50",
    token_network_identifier: getAddress(contractAddress),
  };
  // Do not return a new channel for one that is already opened
  if (
    getChannelByIdAndToken(
      newChannel.channel_identifier,
      newChannel.token_address
    )
  )
    return null;
  return { type: OPEN_CHANNEL, channel: newChannel };
};

const events = {
  CHANNEL_OPENED: "ChannelOpened",
};
