import { from } from "rxjs";
import client from "../../apiRest";
import JSONbig from "json-bigint";

const url = "payments_light/get_messages";

const getTransactionInfo = () =>
  from(
    client
      .get(url, {
        params: { from_message: 1 },
        transformResponse: res_1 => JSONbig.parse(res_1),
      })
      .then(res => res.data)
  );

export { getTransactionInfo };
