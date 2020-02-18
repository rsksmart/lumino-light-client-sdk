import { Lumino } from "..";
import { CALLBACKS } from "./callbacks";

/**
 * Resolves a signature of data, with a lumino handler implementation
 * @param {string} data - The data to sign
 * @param {object} luminoHandler - A lumino handler implementation
 * @param {boolean} isOffChain  -  To indicate if it is for an offChain operation (defaults to false)
 * @returns {string} The signed data
 * @throws Error indicating that the signing failed
 */
const resolver = async (data, luminoHandler, isOffChain = false) =>
  await new Promise((resolve, reject) => {
    let lhSign = luminoHandler.sign;
    if (isOffChain) lhSign = luminoHandler.offChainSign;
    return lhSign(data)
      .then(data => resolve(data))
      .catch(err => {
        Lumino.callbacks.trigger(CALLBACKS.SIGNING_FAIL, err);
        return reject(err);
      });
  });

export default resolver;
