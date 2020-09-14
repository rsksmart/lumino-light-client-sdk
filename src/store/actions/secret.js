import { createRegisterSecretTx } from "../../scripts/secret";
import resolver from "../../utils/handlerResolver";

export const registerSecret = data => async (dispatch, getState, lh) => {
  const { secret, secretRegistryAddress } = data;
  const txParams = { secret, secretRegistryAddress };
  const unsignedTx = await createRegisterSecretTx(txParams);
  const signedTx = await resolver(unsignedTx, lh);
  console.log(signedTx);
};
