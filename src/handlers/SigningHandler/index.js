import { ethers } from "ethers";

const SigningHandler = () => {
  let web3;
  let wallet;
  let decryptedAccount;

  const init = (_web3, _privateKey) => {
    web3 = _web3;
    wallet = new ethers.Wallet(_privateKey);
    decryptedAccount = web3.eth.accounts.privateKeyToAccount(_privateKey);
  };

  const offChainSign = async data => {
    return await wallet.signMessage(data);
  };

  const sign = async tx => {
    const signed_tx = await decryptedAccount.signTransaction(tx);
    return signed_tx.rawTransaction;
  };

  const getAccount = () => {
    return {
      address: decryptedAccount.address,
      privateKey: Buffer.from(
        decryptedAccount.privateKey.replaceAll("0x", ""),
        "hex"
      ),
      privateKeyString: decryptedAccount.privateKey
    };
  };

  return { init, offChainSign, sign, getAccount };
};

export default SigningHandler;
