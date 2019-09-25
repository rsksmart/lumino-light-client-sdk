import keccak from "keccak";
import eccrypto from "eccrypto";

const offChainSign = async (message = "transport02.raiden.network") => {
  const prefix = "\x19Ethereum Signed Message:\n";
  let stringToHash = message;
  if (!message.includes(prefix)) {
    stringToHash = `${prefix}${message.length}${message}`;
  }
  debugger;
  const hashed = keccak("keccak256")
    .update(stringToHash)
    .digest();
  const privKey = new Buffer(
    "3f5d3cda6320fd57f4d47e50c3404e7e43cfb60968d7ef13eb6873760b445e47",
    "hex"
  );
  debugger;
  const pubKey = eccrypto.getPublic(privKey);
  debugger;

  const signed = await eccrypto.sign(privKey, hashed);
  try {
    await eccrypto.verify(pubKey, hashed, signed);
    const signedClone = new Buffer("", "hex");
    signedClone.copy(signed);
    const lastIndex = signedClone.length - 1;
    const v = new Buffer("27", "hex");
    signedClone[lastIndex] = signedClone[lastIndex] + v;
    const fck2 = signedClone.toString("hex");
    const fck = signed.toString("hex");
    debugger;
  } catch (e) {
    console.warn(e);
    debugger;
  }
  debugger;
  return hashed;
};

export default offChainSign;
