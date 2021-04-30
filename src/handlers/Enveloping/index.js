import { RelayProvider, resolveConfiguration } from "@rsksmart/enveloping";
import { getWeb3 } from "../../utils/web3";
import { ERC20Token } from "./interfaces/ERC20Token";
import { ZERO_ADDRESS } from "@rsksmart/rns/lib/constants";
import { SmartWalletFactory } from "./interfaces/SmartWalletFactory";
import { STORE_WALLET } from "../../store/actions/types";
import { Lumino } from "../../index";
import { CALLBACKS } from "../../utils/callbacks";

export default class Enveloping {
  constructor(luminoHandler, luminoConfig) {
    this.luminoHandler = luminoHandler;
    this.luminoConfig = luminoConfig;
  }

  async initialize() {
    const web3 = getWeb3(this.luminoConfig.rskEndpoint);
    const envelopingWeb3 = getWeb3(this.luminoConfig.rskEndpoint);

    console.debug("Resolving configuration for enveloping");

    const envelopingConfig = this.luminoConfig.enveloping;

    const resolvedConfig = await resolveConfiguration(
      envelopingWeb3.currentProvider,
      {
        verbose: window.location.href.includes("verbose"),
        onlyPreferredRelays: true,
        preferredRelays: envelopingConfig.preferredRelays,
        factory: envelopingConfig.smartWalletFactoryContractAddress,
        gasPriceFactorPercent: 0,
        relayLookupWindowBlocks: 1e5,
        chainId: this.luminoConfig.chainId,
        relayVerifierAddress: envelopingConfig.relayVerifierContractAddress,
        deployVerifierAddress: envelopingConfig.deployVerifierContractAddress,
        smartWalletFactoryAddress:
          envelopingConfig.smartWalletFactoryContractAddress,
      }
    );
    resolvedConfig.relayHubAddress = envelopingConfig.relayHubContractAddress;

    console.debug("Enveloping config", resolvedConfig);

    const provider = new RelayProvider(
      envelopingWeb3.currentProvider,
      resolvedConfig
    );
    provider.addAccount(this.luminoHandler.getAccount());
    envelopingWeb3.setProvider(provider);

    this.provider = provider;
    this.web3 = web3;
    this.envelopingWeb3 = envelopingWeb3;
    this.envelopingConfig = envelopingConfig;
    this.resolvedConfig = resolvedConfig;
  }

  getWallets(getState) {
    const luminoData = getState().enveloping;
    if (!luminoData.wallets) {
      return {};
    }
    return luminoData.wallets;
  }

  getWallet(getState, smartWalletAddress) {
    const luminoData = getState().enveloping;
    if (!luminoData.wallets) {
      return null;
    }
    return luminoData.wallets[smartWalletAddress];
  }

  async storeWallet(dispatch, getState, wallet) {
    await dispatch({
      type: STORE_WALLET,
      wallet,
    });
    const wallets = getState().enveloping.wallets;
    Lumino.callbacks.trigger(CALLBACKS.WALLETS_UPDATED, wallets);
  }

  async smartWalletHasCode(smartWalletAddress) {
    let code = await this.web3.eth.getCode(smartWalletAddress);
    return code !== "0x00" && code !== "0x";
  }

  async deploySmartWallet(
    dispatch,
    getState,
    smartWalletAddress,
    smartWalletIndex,
    tokenAddress,
    tokenAmount
  ) {
    console.debug("Checking if the wallet already exists");
    if (!(await this.smartWalletHasCode(smartWalletAddress))) {
      const token = await new this.web3.eth.Contract(
        ERC20Token.getAbi(),
        tokenAddress
      );
      let balance = await token.methods.balanceOf(smartWalletAddress).call();

      if (balance <= 0) {
        console.warn("Funding smart wallet before deploying it...");
        const accounts = await this.web3.eth.getAccounts();
        await token.methods
          .transfer(
            smartWalletAddress,
            this.web3.utils.toWei(tokenAmount.toString(), "ether")
          )
          .send({ from: accounts[0] });
        balance = await token.methods.balanceOf(smartWalletAddress).call();
        console.debug(
          `Smart wallet ${smartWalletAddress} successfully funded with ${tokenAmount} lumino tokens. Balance: ${balance}`
        );
      } else {
        console.debug(
          `No need to fund, the smart wallet has balance ${balance}`
        );
      }

      console.debug("Deploying smart wallet for address", smartWalletAddress);

      const transaction = await this.provider.deploySmartWallet({
        from: this.luminoConfig.address,
        to: ZERO_ADDRESS,
        gas: "0x27100",
        value: "0",
        callVerifier: this.envelopingConfig.deployVerifierContractAddress,
        callForwarder: this.envelopingConfig.smartWalletFactoryContractAddress,
        tokenContract: tokenAddress,
        tokenAmount: tokenAmount.toString(),
        data: "0x",
        index: smartWalletIndex.toString(),
        recoverer: ZERO_ADDRESS,
        isSmartWalletDeploy: true,
        onlyPreferredRelays: true,
        smartWalletAddress: smartWalletAddress,
      });
      console.debug("Smart wallet successfully deployed", transaction);
      const wallet = this.getWallet(getState, smartWalletAddress);
      wallet.deployed = true;
      wallet.deployTransaction = transaction;
      wallet.index = smartWalletIndex;
      wallet.tokenAddress = tokenAddress;
      await this.storeWallet(dispatch, getState, wallet);
      return transaction;
    } else {
      throw new Error("Smart Wallet already deployed");
    }
  }

  async relayTransaction(
    getState,
    smartWalletAddress,
    tokenAmount,
    tokenAddress,
    unsigned_tx
  ) {
    console.debug("Checking if the wallet already exists");
    if (await this.smartWalletHasCode(smartWalletAddress)) {
      const wallet = this.getWallet(getState, smartWalletAddress);
      if (wallet) {
        return this.envelopingWeb3.eth.sendTransaction({
          from: this.luminoConfig.address,
          callVerifier: this.envelopingConfig.relayVerifierContractAddress,
          callForwarder: smartWalletAddress,
          isSmartWalletDeploy: false,
          onlyPreferredRelays: true,
          tokenAmount,
          tokenContract: tokenAddress,
          ...unsigned_tx,
        });
      }
      throw new Error(
        `Smart wallet with address ${smartWalletAddress} is not owned by the user.`
      );
    }
    throw new Error(
      `Smart Wallet is not deployed or the address ${smartWalletAddress} is not a smart wallet.`
    );
  }

  async generateSmartWalletAddress(dispatch, getState, smartWalletIndex) {
    console.debug("Generating computed address for smart wallet");
    const smartWalletAddress = await new this.web3.eth.Contract(
      SmartWalletFactory.getAbi(),
      this.envelopingConfig.smartWalletFactoryContractAddress
    ).methods
      .getSmartWalletAddress(
        this.luminoConfig.address,
        ZERO_ADDRESS,
        smartWalletIndex
      )
      .call();
    const wallet = {
      deployed: false,
      address: smartWalletAddress,
      index: smartWalletIndex,
    };
    console.debug("Checking if the wallet already exists");
    wallet.deployed = await this.smartWalletHasCode(smartWalletAddress);
    await this.storeWallet(dispatch, getState, wallet);
  }
}
