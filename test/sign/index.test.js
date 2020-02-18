import { getPackedData } from "../../src/utils/pack";
import { ethers } from "ethers";
import { MessageType } from "../../src/config/messagesConstants";

const PRIV_KEY =
  "0x15f570a7914ed27b13ba4a63cee82ad4d77bba3cc60b037abef2f1733423eb70";

const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";
const signer = new ethers.Wallet(PRIV_KEY);

test("it should sign correctly a LockExpired", async () => {
  const LE = {
    type: MessageType.LOCK_EXPIRED,
    chain_id: 33,
    nonce: 2,
    token_network_address: "0x877ec5961d18d3413fabbd67696b758fe95408d6",
    message_identifier: "10893010622325126424",
    channel_identifier: 1,
    secrethash:
      "0x2f3a1f9425850b04e2ea7f572594fd2c6a80e3632bdd04144c825a7e49cf21e2",
    transferred_amount: 0,
    locked_amount: 0,
    recipient: "0x29021129f5d038897f01bd4bc050525ca01a4758",
    locksroot:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
  };
  const dataToSign = getPackedData(LE);
  const signature = await signer.signMessage(dataToSign);
  const recoveredAddress = ethers.utils.verifyMessage(dataToSign, signature);
  expect(recoveredAddress).toBe(address);
  // Signature from python test
  const pythonSignature =
    "2cce698001efcc72992d8f7004e7a66d441a4aa2e3ee582176a4b65bd07e106920fb93a7647c447eaac1fb4468dd0724b559b1dca6f3fdfa4cc5a5c6261759281c";
  expect(signature.slice(2)).toBe(pythonSignature);
});

test("should sign and recover from NonClosingBP", async () => {
  const data = {
    type: "Secret",
    chain_id: 33,
    message_identifier: "11519063203689793209",
    payment_identifier: "14479511804263315584",
    secret:
      "0x061c302034fa6a4882788a7ff3834b4e3e8bafbdc572fab8d34113e9e32e5cd8",
    nonce: 12,
    token_network_address: "0x013b47e5eb40a476dc0e9a212d376899288561a2",
    channel_identifier: 22,
    transferred_amount: "60000000",
    locked_amount: 0,
    locksroot:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    signature:
      "0x16820ee8ea32b053e4bb837f528b08e6d4e4afb6c468db4a39dc72cba32f2ff51e5db385b72b524c1c44d4801a06d13216ce3a5261db27847b90e3c4bacf82d11c",
  };

  const dataToSign = getPackedData(data);
  const signature = await signer.signMessage(dataToSign);
  const recoveredAddress = ethers.utils.verifyMessage(dataToSign, signature);
  expect(recoveredAddress).toBe(address);
});

test("should sign and recover from Delivered", async () => {
  const data = {
    type: "Delivered",
    delivered_message_identifier: "18237677588114994956",
  };

  const dataToSign = getPackedData(data);
  const signature = await signer.signMessage(dataToSign);
  const recoveredAddress = ethers.utils.verifyMessage(dataToSign, signature);
  expect(recoveredAddress).toBe(address);
});
