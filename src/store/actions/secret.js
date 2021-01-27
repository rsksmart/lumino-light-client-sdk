import { Lumino } from "../..";
import client from "../../apiRest";
import { createRegisterSecretTx } from "../../scripts/secret";
import { CALLBACKS } from "../../utils/callbacks";
import resolver from "../../utils/handlerResolver";
import { getPaymentByIdAndState } from "../functions/payments";
import { saveLuminoData } from "./storage";
import {
  REGISTERED_ON_CHAIN_SECRET,
  REGISTERING_ON_CHAIN_SECRET,
} from "./types";

export const registerSecret = data => async (dispatch, getState, lh) => {
  const {
    secret,
    secretRegistryAddress,
    paymentId,
    internal_msg_identifier,
  } = data;
  const { address } = Lumino.getConfig();
  const txParams = { secret, secretRegistryAddress, address };
  const unsignedTx = await createRegisterSecretTx(txParams);
  const signedTx = await resolver(unsignedTx, lh);
  const url = "payments_light/register_onchain_secret";
  try {
    dispatch(registeringOnChainSecret(true, paymentId));
    const body = { signed_tx: signedTx, internal_msg_identifier };
    await client.post(url, body, { transformResponse: null });
    dispatch(registeredOnChainSecret(paymentId));
    const payment = getPaymentByIdAndState("pending", paymentId);
    Lumino.callbacks.trigger(CALLBACKS.REGISTERED_ON_CHAIN_SECRET, payment);
    dispatch(saveLuminoData());
  } catch (error) {
    dispatch(registeringOnChainSecret(false, paymentId));
    return false;
  }
};

const registeringOnChainSecret = (
  registeringOnChainSecret,
  paymentId
) => dispatch =>
  dispatch({
    type: REGISTERING_ON_CHAIN_SECRET,
    registeringOnChainSecret,
    paymentId,
  });

const registeredOnChainSecret = paymentId => dispatch =>
  dispatch({
    type: REGISTERED_ON_CHAIN_SECRET,
    registeringOnChainSecret,
    paymentId,
  });
