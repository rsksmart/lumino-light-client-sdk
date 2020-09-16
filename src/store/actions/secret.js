import { Lumino } from "../..";
import client from "../../apiRest";
import { createRegisterSecretTx } from "../../scripts/secret";
import { getRandomBN } from "../../utils/functions";
import resolver from "../../utils/handlerResolver";

export const registerSecret = data => async (dispatch, getState, lh) => {
  const { secret, secretRegistryAddress } = data;
  const { address } = Lumino.getConfig();
  const txParams = { secret, secretRegistryAddress, address };
  const unsignedTx = await createRegisterSecretTx(txParams);
  const signedTx = await resolver(unsignedTx, lh);
  const url = "payments_light/register_onchain_secret";
  console.log(signedTx);
  try {
    const body = { signed_tx: signedTx, message_id: getRandomBN() };
    const res = await client.post(url, body);
    console.log("Success sending onchain secret", res);
  } catch (error) {
    console.error("Error when registering onchain secret", error);
    return false;
  }
};
