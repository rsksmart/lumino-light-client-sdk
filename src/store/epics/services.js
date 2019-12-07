import { from } from "rxjs";
import client from "../../apiRest";
import JSONbig from "json-bigint";
import Store from "../index";
import notifier from "../../notifierRest";

const url = "payments_light/get_messages";

const getTransactionInfo = () => {
  const from_message = Store.getStore().getState().client.internal_msg_id || 1;
  return from(
    client
      .get(url, {
        params: { from_message },
        transformResponse: res_1 => JSONbig.parse(res_1),
      })
      .then(res => res.data)
  );
};

const getNotificationsInfo = () => {
  const state = Store.getStore().getState();
  const { notifierApiKey } = state.client;
  const url = "getNotifications";
  const topics = Object.keys(state.notifier).join(",");

  return from(
    notifier
      .get(url, {
        headers: {
          apiKey: notifierApiKey,
        },
        params: {
          idTopic: topics,
          lastRows: 5,
        },
      })
      .then(res => res.data.data)
  );
};

export { getTransactionInfo, getNotificationsInfo };
