import { ethers } from "ethers";
import { notifierOperations } from "../../notifierRest";
import resolver from "../../utils/handlerResolver";
import {
  NEW_NOTIFIER,
  SUBSCRIBED_TO_NEW_TOPIC,
  UNSUBSCRIBE_FROM_TOPIC,
  START_NOTIFICATIONS_POLLING,
  OPEN_CHANNEL_VOTE,
} from "./types";
import { saveLuminoData } from "./storage";
import { getChannelByIdAndToken } from "../functions";
import { getTokenAddressByTokenNetwork } from "../functions/tokens";
import { requestTokenAddressFromTokenNetwork } from "./tokens";
import Store from "..";
import { SDK_CHANNEL_STATUS } from "../../config/channelStates";

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
      dispatch(saveLuminoData());
    }
  } catch (error) {
    console.error(error);
    const topics = processSubscribe(error.response);
    if (topics.length) {
      topics.forEach(({ topicId }) =>
        dispatch({ type: SUBSCRIBED_TO_NEW_TOPIC, topicId, notifierUrl: url })
      );
      dispatch({ type: START_NOTIFICATIONS_POLLING });
      dispatch(saveLuminoData());
    }
  }
};

export const subscribeToCloseChannel = url => {};

const processSubscribe = res => {
  if (!res.data) return null;
  const { data } = res.data;
  return JSON.parse(String(data));
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

export const manageNotificationData = notificationData => {
  const { notifier, info } = notificationData;

  const notifications = info.map(n => ({
    notification: JSON.parse(n.data),
    notificationId: n.id,
  }));

  return notifications.map(e => {
    const { eventName } = e.notification;
    switch (eventName) {
      case events.CHANNEL_OPENED:
        const action = manageNewChannel(e.notification, notifier);
        return {
          action,
          notificationId: e.notificationId,
          notifier,
        };
      default:
        return null;
    }
  });
};

const manageNewChannel = async (notification, notifier) => {
  const { getAddress } = ethers.utils;
  const { values, contractAddress } = notification;

  const token_network_identifier = getAddress(contractAddress);
  let token_address = getTokenAddressByTokenNetwork(token_network_identifier);
  if (!token_address) {
    token_address = await Store.getStore().dispatch(
      requestTokenAddressFromTokenNetwork(token_network_identifier)
    );
  }

  const channel_identifier = values[0].value;
  // If the token is not in the map, we will request it
  const existingChannel = getChannelByIdAndToken(
    channel_identifier,
    token_address
  );
  const partner_address = getAddress(values[1].value);
  // We need the structure there to give it votes, if there isn't one, we create one
  if (!existingChannel) {
    const channel = createChannelFromNotification({
      ...values,
      channel_identifier,
      token_network_identifier,
      token_address,
    });
    channel.votes = {
      open: {},
      close: {},
    };
    channel.votes.open[notifier] = true;
    return {
      type: OPEN_CHANNEL_VOTE,
      channel: channel,
      notifier,
      shouldOpen: true,
    };
  }
  // Do not process event for already opened channel;
  if (
    existingChannel.sdk_status !==
    SDK_CHANNEL_STATUS.CHANNEL_AWAITING_NOTIFICATION
  )
    return null;

  if (existingChannel.partner_address !== partner_address) return null;
  if (existingChannel.token_address !== token_address) return null;

  return {
    type: OPEN_CHANNEL_VOTE,
    channel: existingChannel,
    notifier,
    shouldOpen: true,
  };
};

const createChannelFromNotification = data => {
  const { getAddress } = ethers.utils;

  return {
    channel_identifier: data.channel_identifier,
    partner_address: getAddress(data[1].value),
    settle_timeout: data[3].value,
    token_address: data.token_address,
    balance: "0",
    state: "opened",
    total_deposit: "0",
    reveal_timeout: "50",
    token_network_identifier: data.token_network_identifier,
  };
};

const events = {
  CHANNEL_OPENED: "ChannelOpened",
};
