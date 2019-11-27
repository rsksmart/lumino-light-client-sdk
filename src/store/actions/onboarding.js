import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";
import { STORE_API_KEY } from "../actions/types";

export const onboardingClient = address => async (dispatch, getState, lh) => {
  try {
    const urlOnboard = "light_clients/matrix/credentials";
    const onboardReq = await client.get(urlOnboard, { params: { address } });
    // We get the data
    const {
      display_name_to_sign,
      seed_retry,
      password_to_sign,
    } = onboardReq.data;
    // Sign it
    const signed_display_name = await resolver(display_name_to_sign, lh, true);
    const signed_password = await resolver(password_to_sign, lh, true);
    const signed_seed_retry = await resolver(seed_retry, lh, true);
    // Prepare a body for the request with all the required data
    const body = {
      address,
      signed_password,
      signed_display_name,
      signed_seed_retry,
      password: password_to_sign,
      display_name: display_name_to_sign,
      seed_retry,
    };
    const urlPostOnboard = "light_clients/";
    const resOnboard = await client.post(urlPostOnboard, body);
    // We extract the api key, set it as a header and store it on redux
    const { api_key } = resOnboard.data;
    client.defaults.headers = { "x-api-key": api_key };
    dispatch({ type: STORE_API_KEY, apiKey: api_key });
  } catch (error) {
    throw error;
  }
};

export const getApiKey = () => (dispatch, getState) => getState().client.apiKey;

export const setApiKey = apiKey => dispatch =>
  dispatch({ type: STORE_API_KEY, apiKey });
