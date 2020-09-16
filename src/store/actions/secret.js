import { Lumino } from "../..";
import client from "../../apiRest";
import { createRegisterSecretTx } from "../../scripts/secret";
import resolver from "../../utils/handlerResolver";
import { REGISTERING_ON_CHAIN_SECRET } from "./types";

export const registerSecret = data => async (dispatch, getState, lh) => {
  const { secret, secretRegistryAddress, paymentId } = data;
  const { address } = Lumino.getConfig();
  const txParams = { secret, secretRegistryAddress, address };
  const unsignedTx = await createRegisterSecretTx(txParams);
  const signedTx = await resolver(unsignedTx, lh);
  const url = "payments_light/register_onchain_secret";
  try {
    dispatch(registeringOnChainSecret(true, paymentId));
    const body = { signed_tx: signedTx };
    const res = await client.post(url, body);
    console.log("Success sending onchain secret", res);
    dispatch(registeredOnChainSecret(paymentId));
  } catch (error) {
    console.error("Error when registering onchain secret", error);
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
    type: REGISTERING_ON_CHAIN_SECRET,
    registeringOnChainSecret,
    paymentId,
  });
