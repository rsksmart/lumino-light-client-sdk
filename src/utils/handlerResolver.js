// The code below will evaluate first the promise, then the code outside of it, after the code of the promise is resolved
const resolver = async (unsigned_tx, luminoHandler) =>
  await new Promise(async (resolve, reject) => {
    const signed_tx = await luminoHandler.sign(unsigned_tx);
    if (signed_tx) return resolve(signed_tx);
    return reject(new Error('Lumino handler never resolved a TX'));
  });

export default resolver;
