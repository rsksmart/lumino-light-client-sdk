import { from } from "rxjs";
import client from "../../apiRest";
import JSONbig from "json-bigint";
import Store from "../index";

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

export { getTransactionInfo };
