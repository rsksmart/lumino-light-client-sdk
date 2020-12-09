import client from "../../apiRest";
import resolver from "../../utils/handlerResolver";
import {
  STORE_API_KEY,
  MESSAGE_POLLING_START,
  REQUEST_CLIENT_ONBOARDING,
  CLIENT_ONBOARDING_SUCCESS,
} from "../actions/types";
import { Lumino } from "../..";
import { CALLBACKS } from "../../utils/callbacks";
import { stopAllPolling } from "./polling";

export const onboardingClient = () => async (dispatch, getState, lh) => {
  const address = getState().client.address;
  try {
    dispatch(stopAllPolling());
    client.defaults.headers = {};
    const urlOnboard = "light_clients/";
    const onboardReq = await client.get(urlOnboard, { params: { address } });

    // Get the onboarding data from the hub
    const {
      transport_type,
      display_name_to_sign,
      seed_retry,
      password_to_sign,
    } = onboardReq.data;

    // Check hub current transport implementation
    let register_body = {};
    if (transport_type === "matrix") {
      // Sign the onboarding matrix data
      const signed_display_name = await resolver(
        display_name_to_sign,
        lh,
        true
      );
      const signed_password = await resolver(password_to_sign, lh, true);
      const signed_seed_retry = await resolver(seed_retry, lh, true);
      // Prepare a body for the request with all the required data
      register_body = {
        registration_data: {
          address,
          signed_password,
          signed_display_name,
          signed_seed_retry,
          password: password_to_sign,
          display_name: display_name_to_sign,
          seed_retry,
        },
      };
    } else if (transport_type === "rif-comms") {
      register_body = {
        registration_data: {
          address,
        },
      };
    } else {
      throw new Error("Onboadring error: hub isnt using rif comms nor matrix");
    }

    // Register the light client
    dispatch({ type: REQUEST_CLIENT_ONBOARDING, address });
    const resOnboard = await client.post(urlOnboard, register_body);
    // We extract the api key, set it as a header and store it on redux
    const { api_key } = resOnboard.data;

    if (api_key) {
      dispatch(setApiKey(api_key));
      dispatch({ type: CLIENT_ONBOARDING_SUCCESS, address });
      const allData = getState();
      return lh.storage.saveLuminoData(allData);
    }

    throw new Error("HUB Response did not have an api_key");
  } catch (error) {
    Lumino.callbacks.trigger(
      CALLBACKS.CLIENT_ONBOARDING_FAILURE,
      address,
      error
    );
  }
};

export const getApiKey = () => (dispatch, getState) => getState().client.apiKey;

export const setApiKey = apiKey => (dispatch, getState, lh) => {
  dispatch({
    type: STORE_API_KEY,
    apiKey,
  });
  dispatch({ type: MESSAGE_POLLING_START });
  client.defaults.headers = {
    "x-api-key": apiKey,
  };

  const allData = getState();
  lh.storage.saveLuminoData(allData);
};
