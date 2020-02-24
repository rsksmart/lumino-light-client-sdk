import {
  getPackedData,
  hexEncode,
  getDataToSignForNonClosingBalanceProof,
} from "../../src/utils/pack";
import { ethers } from "ethers";
import { MessageType } from "../../src/config/messagesConstants";
import resolver from "../../src/utils/handlerResolver";
import Web3 from "web3";
import { SigningHandler } from "../../src";
import callbacks, { CALLBACKS } from "../../src/utils/callbacks";

const PRIV_KEY =
  "0x15f570a7914ed27b13ba4a63cee82ad4d77bba3cc60b037abef2f1733423eb70";

const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";
const signer = new ethers.Wallet(PRIV_KEY);

const signAndRecover = async data => {
  const dataToSign = getPackedData(data);
  if (!dataToSign) return { dataToSign };
  const signature = await signer.signMessage(dataToSign);
  const recoveredAddress = ethers.utils.verifyMessage(dataToSign, signature);
  return { recoveredAddress, signature };
};

test("signature resolver can sign a tx", async () => {
  const web3 = new Web3();
  const handler = SigningHandler();
  handler.init(web3, PRIV_KEY);
  const lh = {
    offChainSign: handler.offChainSign,
    sign: handler.sign,
  };
  const fake_tx = {
    nonce: "1",
    chainId: "33",
    to: "",
    data: "",
    value: "",
    gasPrice: "53000",
    gas: "53000",
  };
  const signedTx = await resolver(fake_tx, lh);
  const signedTxFinal =
    "0xf84d0182cf0882cf0880808065a070830c360c5227444e999842e0ef6fa5cd62dfee90e7b89be737b56b1ca50fc7a02c41856517edb1940d5d7f542f74a9429dc028be5ff16032f786511e318858aa";
  expect(signedTx).toBe(signedTxFinal);
});

test("signature resolver can sign a message", async () => {
  const web3 = new Web3();
  const handler = SigningHandler();
  handler.init(web3, PRIV_KEY);
  const lh = {
    offChainSign: handler.offChainSign,
    sign: handler.sign,
  };
  const dataToSign = hexEncode(address, 20);
  const signature = await resolver(dataToSign, lh, true);
  const recoveredAddress = await ethers.utils.verifyMessage(
    dataToSign,
    signature
  );
  expect(recoveredAddress).toBe(address);
});

test("signature resolver should trigger the failure callback and return the error", async () => {
  const web3 = new Web3();
  const handler = SigningHandler();
  handler.init(web3, PRIV_KEY);
  const lh = {
    offChainSign: handler.offChainSign,
    sign: handler.sign,
  };
  const cbSpy = jest.fn();
  callbacks.set(CALLBACKS.SIGNING_FAIL, cbSpy);

  const result = await resolver(null, lh, true);
  expect(result.error.message).toBe("Cannot read property 'length' of null");
  expect(cbSpy).toBeCalled();
});

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

  const { recoveredAddress, signature } = await signAndRecover(LE);
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

  const dataToSign = getDataToSignForNonClosingBalanceProof(data);
  const signature = await signer.signMessage(dataToSign);
  const recoveredAddress = ethers.utils.verifyMessage(dataToSign, signature);

  expect(recoveredAddress).toBe(address);
  const pythonSignature =
    "94215efdcd1393033d2e0c714a54335148b5f5ee15532728a5a29dc2da2137075898ab2415e41744753427a5c71964a430df3dbc000a1245cfb97632cdaaa4ed1c";
  expect(signature.slice(2)).toBe(pythonSignature);
});

test("should sign and recover from Delivered", async () => {
  const data = {
    type: "Delivered",
    delivered_message_identifier: "18237677588114994956",
  };

  const { recoveredAddress, signature } = await signAndRecover(data);

  expect(recoveredAddress).toBe(address);
  const pythonSignature =
    "5c71e9c516d088d937a1c2a969293fa0631ab9c1a8c7ff2780223c5d2446e272513fd8f80ec4f51999c8294115b1d35e6fc60c3d9af15d2c85205979be17c63a1c";
  expect(signature.slice(2)).toBe(pythonSignature);
});

test("should sign and recover from LockedTransfer", async () => {
  const data = {
    type: "LockedTransfer",
    chain_id: 33,
    message_identifier: "12356138443097947541",
    payment_identifier: "14437077630480195936",
    payment_hash_invoice: "0x",
    nonce: 1,
    token_network_address: "0xb3df4fbd04d29a04d9d0666c009713076e364109",
    token: "0x95aa68e40b4409f8584b6e60796f29c342e7180a",
    channel_identifier: 1,
    transferred_amount: 0,
    locked_amount: 10,
    recipient: "0x29021129f5d038897f01bd4bc050525ca01a4758",
    locksroot:
      "0x300f0f594b8499a2b3a9267b8d281471d5a67e11024f9d4bb7477237d0934936",
    lock: {
      type: "Lock",
      amount: 10,
      expiration: "62697",
      secrethash:
        "0x0caf4611e13f2fc32a6a36224b9603bb890ed9d6a91695a2b3565b0d9bd752f3",
    },
    target: "0x29021129f5d038897f01bd4bc050525ca01a4758",
    initiator: "0x920984391853d81cceec41adb48a45d40594a0ec",
    fee: 0,
  };

  const { recoveredAddress, signature } = await signAndRecover(data);

  expect(recoveredAddress).toBe(address);
  const pythonSignature =
    "783176adc6af4edcee934448d2daf748373c05432e5dae9f995a32d6a618faf348a918f2e80e9fb79d3a641e193d000565adc552b5d3fff2babbb8f2b8d1d3c41b";
  expect(signature.slice(2)).toBe(pythonSignature);
});

test("should sign and recover from RevealSecret", async () => {
  const data = {
    type: "RevealSecret",
    message_identifier: "10945162236180065780",
    secret:
      "0xb8ed582d16853c82a9a9a384118fcd10889ab0a5a3224ec6008bd88582319fc3",
  };
  const { recoveredAddress, signature } = await signAndRecover(data);

  expect(recoveredAddress).toBe(address);
  const pythonSignature =
    "92a104a35c7113bea95fd3dae1216d2423e4aeccb6c7d72c8cee86843177d9ff13015e6b782ee894fec4ce2976a1e6a24b26a76836720e3accc837faf6001f601b";
  expect(signature.slice(2)).toBe(pythonSignature);
});

test("should sign and recover from SecretRequest", async () => {
  const data = {
    type: "SecretRequest",
    message_identifier: "9443946215632930647",
    payment_identifier: "1322351847924173620",
    amount: "100000000000000000",
    expiration: "12000000",
    secrethash:
      "0xaf1ca2932cb5c3e3045eedb17ce760419d2b3e5234eeefe6fd82475adeb4da10",
  };

  const { recoveredAddress, signature } = await signAndRecover(data);

  expect(recoveredAddress).toBe(address);
  const pythonSignature =
    "84a0f8b095cb00141023125000afa88549c57014baeed9779ef5fe4828064151289f49dda9486174a2dc5736b0a40f91cfdf4f381ecee7d6f0f822b23adb9b1c1c";
  expect(signature.slice(2)).toBe(pythonSignature);
});

test("should sign and recover from Processed", async () => {
  const data = {
    type: "Processed",
    message_identifier: "18237677588114994956",
  };

  const { recoveredAddress, signature } = await signAndRecover(data);

  expect(recoveredAddress).toBe(address);
  const pythonSignature =
    "4e3845c55504abaae7a47a6337a154b628dd6d2be52ee7cd0e249602bfa20940236ac14582ad95e6dcc7cfef5760688dc0846b13525edf2895b9246e2a0e1d371b";
  expect(signature.slice(2)).toBe(pythonSignature);
});

test("should sign and recover from Secret (Balance Proof)", async () => {
  const data = {
    type: "Secret",
    chain_id: 33,
    message_identifier: "4334089825906208294",
    payment_identifier: "15193824610622741555",
    secret:
      "0x8c45240e576c4befd51d063549ce18859c5a2b3c356035884588a65c3dfcef4b",
    nonce: 2,
    token_network_address: "0x7351ed719de72db92a54c99ef2c4d287f69672a1",
    channel_identifier: 1,
    transferred_amount: "1000000000000000",
    locked_amount: 0,
    locksroot:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
  };

  const { recoveredAddress, signature } = await signAndRecover(data);

  expect(recoveredAddress).toBe(address);
  const pythonSignature =
    "380781aecce7dfa0248fb540b55902484f29a379c8a573d038cffbf08227c52210bccef593fb4b1b110722756439b0336085462b0224471c4f9f831e2009c9f91c";
  expect(signature.slice(2)).toBe(pythonSignature);
});

test("should return null dataToSign for unknown messages", async () => {
  const data = {
    type: "NOT_VALID",
  };
  //
  const { dataToSign } = await signAndRecover(data);
  expect(dataToSign).toBe(null);
});

test("should throw error on incorrect hex data length when encoding", async () => {
  try {
    hexEncode("0x123", 1);
  } catch (error) {
    expect(error.message).toBe(
      "Uint8Array or hex string must be of exact length"
    );
  }
});
