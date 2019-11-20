import { from } from "rxjs";
import client from "../../apiRest";
import JSONbig from "json-bigint";

const api_key = "29ad65a6ba88a0c9d732dad37b1dd3c45b9f9130";
const url = "payments_light/get_messages";

// TODO: Remove the hardcoded api_key

const getTransactionInfo = () =>
  from(
    client
      .get(url, {
        headers: {
          "rxjs-custom-header": "Rxjs",
          "x-api-key": api_key,
          "Content-type": "application/json",
        },
        params: { from_message: 1 },
        transformResponse: res_1 => JSONbig.parse(res_1),
      })
      .then(res => res.data)
  );

export { getTransactionInfo };
