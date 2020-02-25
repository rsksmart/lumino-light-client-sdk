import { from } from "rxjs";
import client from "../../apiRest";

import notifierGet from "../../notifierRest";
import allSettled from "promise.allsettled";
import { getState } from "../functions/state";

const requestMessages = async (from_message, url) =>
  client
    .get(url, {
      params: { from_message },
    })
    .then(res => {
      return res.data;
    })
    .catch(err => err);

const getTransactionInfo = () => {
  const from_message = getState().client.internal_msg_id || 1;
  const url = "light_client_messages";
  return from(requestMessages(from_message, url));
};

const requestNotifications = data => {
  const endpoint = "getNotifications";

  const { apiKey, topics: idTopic, url, fromId } = data;
  notifierGet.defaults.baseURL = url;
  notifierGet.defaults.headers = {
    apiKey,
  };
  notifierGet.defaults.params = {
    idTopic,
    lastRows: 5,
    fromId,
  };
  const val = notifierGet.get(endpoint);
  return val;
};

const resolveNotificationPromises = data =>
  data.then(promises => {
    const errors = promises
      .filter(p => p.status === "rejected")
      .map(p => p.reason);
    const fulfilled = promises.filter(p => p.status !== "rejected");
    return { errors, fulfilled };
  });

const getNotificationsInfo = () => {
  // We process the data from the reducer to get a simple array of objects
  const notifierObj = getState().notifier;
  const notifiers = Object.entries(notifierObj.notifiers).map(([k, v]) => ({
    url: k,
    apiKey: v.apiKey,
    topics: Object.keys(v.topics || {}).join(","),
    fromId: v.fromNotificationId,
  }));

  // We settle promises for each notifier, using all settled to prevent short circuits
  const results = allSettled(notifiers.map(requestNotifications));
  return from(resolveNotificationPromises(results));
};

export {
  getTransactionInfo,
  getNotificationsInfo,
  requestMessages,
  resolveNotificationPromises,
  requestNotifications,
};
