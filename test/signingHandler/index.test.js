import SigningHandler from "../../src/handlers/SigningHandler";
import Web3 from "web3";
import { hexEncode } from "../../src/utils/pack";
import { ethers } from "ethers";

describe("Test for default signing handler", () => {
  const PRIV_KEY =
    "0x15f570a7914ed27b13ba4a63cee82ad4d77bba3cc60b037abef2f1733423eb70";
  const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";

  const web3 = new Web3();
  const handler = SigningHandler();
  handler.init(web3, PRIV_KEY);

  test("Can sign simple message", async () => {
    const dataToSign = hexEncode(address, 20);
    const signature = await handler.offChainSign(dataToSign);
    const recoveredAddress = await ethers.utils.verifyMessage(
      dataToSign,
      signature
    );
    expect(recoveredAddress).toBe(address);
  });

  test("Can sign a transaction", async () => {
    const fake_tx = {
      nonce: "1",
      chainId: "33",
      to: "",
      data: "",
      value: "",
      gasPrice: "53000",
      gas: "53000",
    };
    const signedTx = await handler.sign(fake_tx);
    const signedTxFinal =
      "0xf84d0182cf0882cf0880808065a070830c360c5227444e999842e0ef6fa5cd62dfee90e7b89be737b56b1ca50fc7a02c41856517edb1940d5d7f542f74a9429dc028be5ff16032f786511e318858aa";
    expect(signedTx).toBe(signedTxFinal);
  });
});
