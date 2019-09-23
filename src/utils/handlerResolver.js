// The code below will evaluate first the promise, then the code outside of it, after the code of the promise is resolved
const resolver = async (unsigned_tx, luminoHandler, isOffChain = false) =>
  await new Promise(async (resolve, reject) => {
    let lhSign = luminoHandler.sign;
    if (isOffChain) lhSign = luminoHandler.offChainSign;
    const signed_tx = await lhSign(unsigned_tx);
    if (signed_tx) return resolve(signed_tx);
    return reject(new Error("Lumino handler never resolved a signed TX"));
  });

export default resolver;
