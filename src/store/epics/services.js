import { from } from "rxjs";
import client from "../../apiRest";
import Store from "../index";
import notifierGet from "../../notifierRest";
import allSettled from "promise.allsettled";

const url = "light_client_messages";

const getTransactionInfo = () => {
  const from_message = Store.getStore().getState().client.internal_msg_id || 1;
  return from(
    client
      .get(url, {
        params: { from_message },
      })
      .then(res => res.data)
  );
};

const getNotificationsInfo = () => {
  // We process the data from the reducer to get a simple array of objects
  const notifierObj = Store.getStore().getState().notifier;
  const notifiers = Object.entries(notifierObj.notifiers).map(([k, v]) => ({
    url: k,
    apiKey: v.apiKey,
    topics: Object.keys(v.topics || {}).join(","),
    fromId: v.fromNotificationId,
  }));
  const endpoint = "getNotifications";

  // We settle promises for each notifier, using all settled to prevent short circuits
  const results = allSettled(
    notifiers.map(n => {
      const { apiKey, topics: idTopic, url, fromId } = n;
      notifierGet.defaults.baseURL = url;
      notifierGet.defaults.headers = {
        apiKey,
      };
      notifierGet.defaults.params = {
        idTopic,
        lastRows: 5,
        fromId,
      };

      return notifierGet.get(endpoint);
    })
  );
  return from(
    results.then(promises => {
      const errors = promises
        .filter(p => p.status === "rejected")
        .map(p => p.reason);
      const fulfilled = promises.filter(p => p.status !== "rejected");
      return { errors, fulfilled };
    })
  );
};

export { getTransactionInfo, getNotificationsInfo };
