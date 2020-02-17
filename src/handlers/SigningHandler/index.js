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

  const offChainSign = data => {
    const signature = wallet.signMessage(data);
    return signature;
  };

  const sign = async tx => {
    const signed_tx = await decryptedAccount.signTransaction(tx);
    return signed_tx.rawTransaction;
  };

  return { init, offChainSign, sign };
};

export default SigningHandler;
