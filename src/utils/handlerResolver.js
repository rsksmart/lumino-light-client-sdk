/**
 * Resolves a signature of data, with a lumino handler implementation
 * @param {string} data - The data to sign
 * @param {object} luminoHandler - A lumino handler implementation
 * @param {boolean} isOffChain  -  To indicate if it is for an offChain operation (defaults to false)
 * @returns {string} The signed data
 * @throws Error indicating that the signing failed
 */
const resolver = async (data, luminoHandler, isOffChain = false) =>
  await new Promise(async (resolve, reject) => {
    let lhSign = luminoHandler.sign;
    if (isOffChain) lhSign = luminoHandler.offChainSign;
    const signed_data = await lhSign(data);
    if (signed_data) return resolve(signed_data);
    return reject(new Error("Lumino handler had an error signing"));
  });

export default resolver;
