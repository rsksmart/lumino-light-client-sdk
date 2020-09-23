import { ethers } from "ethers";
import { notifierOperations } from "../../notifierRest";
import resolver from "../../utils/handlerResolver";
import {
  NEW_NOTIFIER,
  SUBSCRIBED_TO_NEW_TOPIC,
  UNSUBSCRIBE_FROM_TOPIC,
  START_NOTIFICATIONS_POLLING,
  OPEN_CHANNEL_VOTE,
  REMOVE_NOTIFIER,
  CLOSE_CHANNEL_VOTE,
} from "./types";
import { saveLuminoData } from "./storage";
import { getChannelByIdAndToken } from "../functions";
import { getTokenAddressByTokenNetwork } from "../functions/tokens";
import {
  requestTokenAddressFromTokenNetwork,
  getTokenNameAndSymbol,
} from "./tokens";
import Store from "..";
import { SDK_CHANNEL_STATUS } from "../../config/channelStates";
import { getState } from "../functions/state";
import { AddressZero } from "ethers/constants";

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

const prepareSubscribeActions = (data, url) => {
  let topics = processSubscribe(data);
  if (!Array.isArray(topics)) topics = [topics];

  if (topics && topics.length)
    return topics.map(({ topicId }) => ({
      type: SUBSCRIBED_TO_NEW_TOPIC,
      topicId,
      notifierUrl: url,
    }));
  return [];
};

const getNotifierApiKey = (url, getStateFn) => {
  const notifier = getStateFn().notifier.notifiers[url];
  if (!notifier) return console.error(`Notifier ${url} not registered!`);
  const { apiKey } = notifier;
  if (!apiKey) return console.error(`API Key not present for notifier ${url}`);

  return apiKey;
};

export const subscribeToOpenChannel = url => async (dispatch, getState) => {
  try {
    const { address } = getState().client;
    const apiKey = getNotifierApiKey(url, getState);
    if (!apiKey) return null;
    const endpoint = "subscribeToLuminoOpenChannels";
    notifierOperations.defaults.baseURL = url;

    let topicsToDispatch = [];

    let resOpenPartner;
    const reqConfig = {
      headers: {
        apiKey,
      },
      params: {
        participanttwo: address,
      },
    };
    try {
      resOpenPartner = await notifierOperations.post(endpoint, null, reqConfig);
    } catch (error) {
      console.error(error);
      if (error.response) {
        const actions = prepareSubscribeActions(error.response, url);
        topicsToDispatch = topicsToDispatch.concat(actions);
        dispatch(saveLuminoData());
      }
    }
    let resOpenSelf;
    try {
      resOpenSelf = await notifierOperations.post(endpoint, null, {
        headers: {
          apiKey,
        },
        params: {
          participantone: address,
        },
      });
    } catch (error) {
      console.error(error);
      if (error.response) {
        const actions = prepareSubscribeActions(error.response, url);
        topicsToDispatch = topicsToDispatch.concat(actions);
        dispatch(saveLuminoData());
      }
    }

    if (resOpenPartner) {
      const actions = prepareSubscribeActions(resOpenPartner, url);
      topicsToDispatch = topicsToDispatch.concat(actions);
    }

    if (resOpenSelf) {
      const actions = prepareSubscribeActions(resOpenSelf, url);
      topicsToDispatch = topicsToDispatch.concat(actions);
    }

    if (topicsToDispatch.length) {
      topicsToDispatch.forEach(t => dispatch(t));
      dispatch({
        type: START_NOTIFICATIONS_POLLING,
      });
      dispatch(saveLuminoData());
    }
  } catch (error) {
    console.error(error);
  }
};

const requestForCloseChannel = async data => {
  const { url, token, closingparticipant, channelId = null, apiKey } = data;
  try {
    const reqConfig = {
      headers: {
        apiKey,
      },
      params: {
        closingparticipant,
        token,
        channelidentifier: channelId,
      },
    };
    if (!reqConfig.params.channelidentifier)
      delete reqConfig.params.channelidentifier;
    notifierOperations.defaults.baseURL = url;
    const endpoint = "subscribeToCloseChannel";
    const resClose = await notifierOperations.post(endpoint, null, reqConfig);

    return prepareSubscribeActions(resClose, url);
  } catch (error) {
    if (error.response && error.response.data)
      return prepareSubscribeActions(error.response, url);

    console.log(error);
    return [];
  }
};

export const subscribeToUserClosesChannelOnToken = (url, token) => async (
  dispatch,
  getState
) => {
  const { address } = getState().client;
  const apiKey = getNotifierApiKey(url, getState);
  if (!apiKey) return null;
  const data = { url, token, closingparticipant: address, apiKey };
  const actions = await requestForCloseChannel(data);
  actions.forEach(a => dispatch(a));
  return dispatch(saveLuminoData());
};
/**
 *
 * @param {*} url Notifier URL
 * @param {*} channelId The channel identifier
 * @param {*} token The token network
 */
export const subscribeToPartnerClosesSpecificChannel = (
  url,
  channelId,
  token
) => async (dispatch, getState) => {
  const apiKey = getNotifierApiKey(url, getState);
  if (!apiKey) return null;
  const tokenAddress = await getTokenAddressByTokenNetwork(token);
  const channel = getChannelByIdAndToken(channelId, tokenAddress);

  if (!channel)
    return console.error("No channel found for the parameters specified");
  const { partner_address } = channel;

  const data = { url, token, closingparticipant: partner_address, apiKey };
  const actions = await requestForCloseChannel(data);
  actions.forEach(a => dispatch(a));
  return dispatch(saveLuminoData());
};

export const removeNotifier = url => async (dispatch, getState) => {
  const { notifiers } = getState().notifier;
  if (notifiers[url]) {
    return dispatch({
      type: REMOVE_NOTIFIER,
      url,
    });
  }
  console.error("Provided notifier was not found in the SDK");
};

const processSubscribe = res => {
  if (!res.data) return {};
  const { data } = res.data;
  return JSON.parse(String(data));
};

export const unsubscribeFromTopic = (url, idTopic) => async (
  dispatch,
  getState
) => {
  try {
    const { notifierApiKey } = getState().client;
    const url = "unsubscribeFromTopic";
    await notifierOperations.post(url, null, {
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

  return notifications.map(async e => {
    const { eventName } = e.notification;

    switch (eventName) {
      case events.CHANNEL_OPENED: {
        const action = manageNewChannel(e.notification, notifier);
        return {
          action,
          notificationId: e.notificationId,
          notifier,
        };
      }
      case events.CHANNEL_CLOSED: {
        const action = manageCloseChannel(e.notification, notifier);
        return {
          action,
          notificationId: e.notificationId,
          notifier,
        };
      }
      default:
        return null;
    }
  });
};

const manageCloseChannel = async (notification, notifier) => {
  const { getAddress } = ethers.utils;
  const { values, contractAddress } = notification;

  const channelId = values[0].value;

  // const closerAddress = getAddress(values[1].value);
  const tokenAddress = getTokenAddressByTokenNetwork(
    getAddress(contractAddress)
  );
  // const nonce = values[2]; Not needed , but we document it anyway

  const existingChannel = getChannelByIdAndToken(channelId, tokenAddress);
  if (existingChannel)
    return {
      type: CLOSE_CHANNEL_VOTE,
      channel: existingChannel,
      notifier,
      shouldClose: true,
    };

  return null;
};

const manageNewChannel = async (notification, notifier) => {
  const { getAddress } = ethers.utils;
  const { values, contractAddress } = notification;

  const token_network_identifier = getAddress(contractAddress);
  let token_address = getTokenAddressByTokenNetwork(token_network_identifier);
  if (!token_address || token_address === AddressZero) {
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
  const selfAddress = getState().client.address;

  // NOTE: The opener of the channel is the value[2] which is the first address

  let partner_address = getAddress(values[2].value);
  // We check it to make sure to get the correct partner
  let openedByUser = true;

  if (partner_address === getAddress(selfAddress)) {
    partner_address = getAddress(values[1].value);
    openedByUser = false;
  }

  if (!existingChannel) {
    // We need the structure there to give it votes, if there isn't one, we create one
    const { token_name, token_symbol } = await Store.getStore().dispatch(
      getTokenNameAndSymbol(token_address)
    );

    const channel = createChannelFromNotification({
      ...values,
      openedByUser,
      channel_identifier,
      token_network_identifier,
      token_name,
      token_symbol,
      token_address,
      partner_address,
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

const createChannelFromNotification = data => ({
  channel_identifier: data.channel_identifier,
  partner_address: data.partner_address,
  settle_timeout: data[3].value,
  token_address: data.token_address,
  token_name: data.token_name,
  token_symbol: data.token_symbol,
  openedByUser: data.openedByUser,
  balance: "0",
  state: "opened",
  total_deposit: "0",
  reveal_timeout: "50",
  token_network_identifier: data.token_network_identifier,
});

const events = {
  CHANNEL_OPENED: "ChannelOpened",
  CHANNEL_CLOSED: "ChannelClosed",
};
