import * as signatureResolver from "../../../src/utils/handlerResolver";
import * as packFunctions from "../../../src/utils/pack";
import callbacks, { CALLBACKS } from "../../../src/utils/callbacks";
import client from "../../../src/apiRest";
import * as paymentFunctions from "../../../src/store/actions/payment";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import * as stateFunctions from "../../../src/store/functions/state";
import * as hashes from "../../../src/utils/generateHashes";
import { ethers } from "ethers";
import { CHANNEL_OPENED } from "../../../src/config/channelStates";
import {
  CREATE_PAYMENT,
  ADD_PENDING_PAYMENT_MESSAGE,
  ADD_EXPIRED_PAYMENT_MESSAGE,
  UPDATE_NON_CLOSING_BP,
  PUT_LOCK_EXPIRED,
} from "../../../src/store/actions/types";
import {
  MessageType,
  PAYMENT_EXPIRED,
} from "../../../src/config/messagesConstants";
import { EXPIRED } from "../../../src/config/paymentConstants";
import { getRandomBN } from "../../../src/utils/functions";
import * as tokenFunctions from "../../../src/store/functions/tokens";
import * as recover from "../../../src/utils/validators";

// Mock store
const lh = {
  storage: { saveLuminoData: jest.fn() },
};
const middlewares = [thunk.withExtraArgument(lh)];
const mockStore = configureMockStore(middlewares);

const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";
const randomPartner = "0xB59ef6015d0e5d46AC9515dcd3f8b928Bb7F87d3";
const randomAddress = "0xe3066B701f4a3eC8EcAA6D63ADc45180e5022bA3";
const constantHashes = {
  hash: ethers.constants.HashZero,
  secrethash: ethers.utils.keccak256(ethers.constants.HashZero),
};

describe("test payment actions", () => {
  const spyResolver = jest.spyOn(signatureResolver, "default");
  const spyCallbacks = jest.spyOn(callbacks, "trigger");
  const spyGetState = jest.spyOn(stateFunctions, "getState");
  const spyHashes = jest.spyOn(hashes, "default");
  const channelKey = `1-${randomAddress}`;
  const state = {
    client: {
      address,
    },
    channelReducer: {
      [channelKey]: {
        partner_address: randomPartner,
        creator_address: address,
        channel_identifier: 1,
        token_address: randomAddress,
        offChainBalance: "10000000000000",
      },
    },
    channelStates: {
      [channelKey]: CHANNEL_OPENED,
    },
  };

  afterEach(() => {
    spyResolver.mockReset();
    spyCallbacks.mockReset();
    spyGetState.mockReset();
  });

  test("should create a payment LT successfully", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const params = {
      amount: "10000000000000",
      partner: randomPartner,
      token_address: randomAddress,
    };
    const message_content = {
      message: {
        nonce: 1,
        channel_identifier: 1,
        chain_id: 33,
        target: randomPartner,
        initiator: address,
        token: randomAddress,
        lock: {
          amount: "10000000000000",
        },
      },
      message_order: 1,
      payment_id: "987654321",
    };

    // Spies
    const spyPack = jest.spyOn(packFunctions, "getDataToSignForLockedTransfer");
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyResolver.mockResolvedValue(mockedSignature);
    spyHashes.mockReturnValue(constantHashes);
    client.post.mockResolvedValue({ data: { message_content } });
    spyGetState.mockImplementation(() => store.getState());

    await store.dispatch(paymentFunctions.createPayment(params));
    const paymentData = {
      amount: message_content.message.lock.amount,
      chainId: message_content.message.chain_id,
      channelId: message_content.message.channel_identifier,
      initiator: message_content.message.initiator,
      message_order: message_content.message_order,
      messages: {
        "1": {
          message: {
            chain_id: message_content.message.chain_id,
            channel_identifier: message_content.message.channel_identifier,
            initiator: message_content.message.initiator,
            lock: {
              amount: message_content.message.lock.amount,
              secrethash: constantHashes.secrethash,
            },
            nonce: 1,
            signature: mockedSignature,
            target: message_content.message.target,
            token: message_content.message.token,
          },
          message_order: message_content.message_order,
          message_type_value: "PaymentSuccessful",
          payment_id: message_content.payment_id,
          receiver: message_content.message.target,
          sender: message_content.message.initiator,
        },
      },
      partner: message_content.message.target,
      paymentId: message_content.payment_id,
      secret: constantHashes.hash,
      secret_hash: constantHashes.secrethash,
      token: message_content.message.token,
      tokenName: undefined,
      tokenSymbol: undefined,
      tokenNetworkAddress: undefined,
    };
    expect(spyCallbacks).toHaveBeenCalledWith(
      CALLBACKS.SENT_PAYMENT,
      paymentData
    );
    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      channelId: 1,
      payment: paymentData,
      paymentId: paymentData.paymentId,
      token: paymentData.token,
      type: CREATE_PAYMENT,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("should create a mediated payment LT successfully", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const params = {
      amount: "10000000000000",
      partner: randomPartner,
      token_address: randomAddress,
    };
    const recipient = "0x23017204664df590b8b7F583bce3d13bd6Db3b0e";
    const message_content = {
      message: {
        nonce: 1,
        channel_identifier: 1,
        chain_id: 33,
        target: randomPartner,
        initiator: address,
        recipient,
        token: randomAddress,
        lock: {
          amount: "10000000000000",
        },
      },
      message_order: 1,
      payment_id: "987654321",
    };

    // Spies
    const spyPack = jest.spyOn(packFunctions, "getDataToSignForLockedTransfer");
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyResolver.mockResolvedValue(mockedSignature);
    spyHashes.mockReturnValue(constantHashes);
    client.post.mockResolvedValue({ data: { message_content } });
    spyGetState.mockImplementation(() => store.getState());

    await store.dispatch(paymentFunctions.createPayment(params));
    const paymentData = {
      amount: message_content.message.lock.amount,
      chainId: message_content.message.chain_id,
      channelId: message_content.message.channel_identifier,
      initiator: message_content.message.initiator,
      isMediated: true,
      mediator: recipient,
      message_order: message_content.message_order,
      messages: {
        "1": {
          message: {
            chain_id: message_content.message.chain_id,
            channel_identifier: message_content.message.channel_identifier,
            initiator: message_content.message.initiator,
            lock: {
              amount: message_content.message.lock.amount,
              secrethash: constantHashes.secrethash,
            },
            nonce: 1,
            recipient,
            signature: mockedSignature,
            target: message_content.message.target,
            token: message_content.message.token,
          },
          message_order: message_content.message_order,
          message_type_value: "PaymentSuccessful",
          payment_id: message_content.payment_id,
          receiver: message_content.message.target,
          sender: message_content.message.initiator,
        },
      },
      partner: message_content.message.target,
      paymentId: message_content.payment_id,
      secret: constantHashes.hash,
      secret_hash: constantHashes.secrethash,
      token: message_content.message.token,
      tokenName: undefined,
      tokenSymbol: undefined,
      tokenNetworkAddress: undefined,
    };
    expect(spyCallbacks).toHaveBeenCalledWith(
      CALLBACKS.SENT_PAYMENT,
      paymentData
    );
    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      channelId: 1,
      payment: paymentData,
      paymentId: paymentData.paymentId,
      token: paymentData.token,
      type: CREATE_PAYMENT,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("should reject creation if insufficient funds", async () => {
    const store = mockStore(state);

    // Values for payment
    const params = {
      amount: "1000000000000000000000",
      partner: randomPartner,
      token_address: randomAddress,
    };

    // Spies
    spyGetState.mockImplementation(() => store.getState());

    await store.dispatch(paymentFunctions.createPayment(params));
    const expectedCallbackData = {
      amount: params.amount,
      partner: params.partner,
      token: params.token_address,
    };
    expect(spyCallbacks).toHaveBeenCalledWith(
      CALLBACKS.FAILED_CREATE_PAYMENT,
      expectedCallbackData,
      Error("Insufficient funds for payment")
    );
  });

  test("should successfully put a delivered message for Successful flow", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const payment = {
      isReceived: false,
      initiator: address,
      partner: randomPartner,
      paymentId: "1234",
    };
    const message = {
      message_identifier: 1123123,
    };

    // Spies
    const spyPack = jest.spyOn(packFunctions, "getDataToSignForDelivered");
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyResolver.mockResolvedValue(mockedSignature);
    client.put.mockResolvedValue("Message received");
    spyGetState.mockImplementation(() => store.getState());

    await store.dispatch(paymentFunctions.putDelivered(message, payment));

    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      message: {
        message: {
          delivered_message_identifier: message.message_identifier,
          signature: mockedSignature,
          type: MessageType.DELIVERED,
        },
        message_order: 4,
      },
      messageOrder: 4,
      paymentId: payment.paymentId,
      type: ADD_PENDING_PAYMENT_MESSAGE,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("should put delivered for expired payment flow", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const payment = {
      isReceived: false,
      initiator: address,
      partner: randomPartner,
      paymentId: "1234",
      failureReason: EXPIRED,
    };
    const message = {
      message_identifier: 1123123,
    };

    // Spies
    const spyPack = jest.spyOn(packFunctions, "getDataToSignForDelivered");
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyResolver.mockResolvedValue(mockedSignature);
    client.put.mockResolvedValue("Message received");
    spyGetState.mockImplementation(() => store.getState());

    await store.dispatch(paymentFunctions.putDelivered(message, payment));

    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      message: {
        message: {
          delivered_message_identifier: message.message_identifier,
          signature: mockedSignature,
          type: MessageType.DELIVERED,
        },
        message_order: 4,
      },
      messageOrder: 4,
      paymentId: payment.paymentId,
      storeInMessages: false,
      type: ADD_EXPIRED_PAYMENT_MESSAGE,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("should successfully put a processed message for Successful flow", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const payment = {
      isReceived: false,
      initiator: address,
      partner: randomPartner,
      paymentId: "1234",
    };
    const message = {
      message_identifier: 1123123,
    };

    // Spies
    const spyPack = jest.spyOn(packFunctions, "getDataToSignForProcessed");
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyResolver.mockResolvedValue(mockedSignature);
    client.put.mockResolvedValue("Message received");
    spyGetState.mockImplementation(() => store.getState());

    await store.dispatch(paymentFunctions.putProcessed(message, payment));

    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      message: {
        message: {
          message_identifier: message.message_identifier,
          signature: mockedSignature,
          type: MessageType.PROCESSED,
        },
        message_order: 3,
      },
      messageOrder: 3,
      paymentId: payment.paymentId,
      type: ADD_PENDING_PAYMENT_MESSAGE,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("should successfully put a processed message for Expired flow", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const payment = {
      isReceived: false,
      initiator: address,
      partner: randomPartner,
      failureReason: EXPIRED,
      paymentId: "1234",
    };
    const message = {
      message_identifier: 1123123,
    };

    // Spies
    const spyPack = jest.spyOn(packFunctions, "getDataToSignForProcessed");
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyResolver.mockResolvedValue(mockedSignature);
    client.put.mockResolvedValue("Message received");
    spyGetState.mockImplementation(() => store.getState());

    await store.dispatch(paymentFunctions.putProcessed(message, payment));

    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      message: {
        message: {
          message_identifier: message.message_identifier,
          signature: mockedSignature,
          type: MessageType.PROCESSED,
        },
        message_order: 3,
      },
      messageOrder: 3,
      paymentId: payment.paymentId,
      storeInMessages: false,
      type: ADD_EXPIRED_PAYMENT_MESSAGE,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("Should successfully put a SecretRequest", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const payment = {
      isReceived: false,
      initiator: address,
      amount: "10000000000",
      partner: randomPartner,
      paymentId: "1234",
      secret_hash: "0x129Af",
    };
    const message = {
      message_identifier: 1123123,
      expiration: 5000000,
    };

    // Spies
    const spyPack = jest.spyOn(packFunctions, "getDataToSignForSecretRequest");
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyResolver.mockResolvedValue(mockedSignature);
    client.put.mockResolvedValue("Message received");
    spyGetState.mockImplementation(() => store.getState());

    await store.dispatch(paymentFunctions.putSecretRequest(message, payment));

    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      message: {
        message: {
          amount: payment.amount,
          expiration: message.expiration,
          message_identifier: message.message_identifier,
          signature: mockedSignature,
          payment_identifier: payment.paymentId,
          secrethash: payment.secret_hash,
          type: MessageType.SECRET_REQUEST,
        },
        message_order: 5,
      },
      messageOrder: 5,
      paymentId: payment.paymentId,
      type: ADD_PENDING_PAYMENT_MESSAGE,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("it should put a RevealSecret", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const payment = {
      isReceived: false,
      initiator: address,
      amount: "10000000000",
      partner: randomPartner,
      paymentId: "1234",
      secret: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
    };

    // Spies
    const spyPack = jest.spyOn(packFunctions, "getDataToSignForSecretRequest");
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyResolver.mockResolvedValue(mockedSignature);
    client.put.mockResolvedValue("Message received");
    spyGetState.mockImplementation(() => store.getState());
    const message_identifier = getRandomBN();
    await store.dispatch(
      paymentFunctions.putRevealSecret(payment, message_identifier)
    );

    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      message: {
        message: {
          message_identifier,
          secret: payment.secret,
          signature: mockedSignature,
          type: MessageType.REVEAL_SECRET,
        },
        message_order: 7,
      },
      messageOrder: 7,
      paymentId: payment.paymentId,
      type: ADD_PENDING_PAYMENT_MESSAGE,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("should successfully put a BalanceProof", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const payment = {
      isReceived: false,
      initiator: address,
      amount: "10000000000",
      partner: randomPartner,
      paymentId: "1234",
      secret: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
    };
    const message = {
      type: MessageType.SECRET,
      chain_id: 33,
      message_identifier: "123321",
      payment_identifier: "1231234",
      token_network_address: randomAddress,
      secret:
        "0x2f3a1f9425850b04e2ea7f572594fd2c6a80e3632bdd04144c825a7e49cf21e2",
      nonce: 1,
      channel_identifier: 1,
      transferred_amount: "1000000000000000",
      locked_amount: 0,
      locksroot:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    };

    // Spies
    const spyPack = jest.spyOn(packFunctions, "getDataToSignForSecretRequest");
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyResolver.mockResolvedValue(mockedSignature);
    client.put.mockResolvedValue("Message received");
    spyGetState.mockImplementation(() => store.getState());
    await store.dispatch(paymentFunctions.putBalanceProof(message, payment));

    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      message: {
        message: {
          chain_id: message.chain_id,
          channel_identifier: message.channel_identifier,
          locked_amount: message.locked_amount,
          locksroot: message.locksroot,
          message_identifier: message.message_identifier,
          nonce: message.nonce,
          payment_identifier: message.payment_identifier,
          secret: message.secret,
          signature: mockedSignature,
          token_network_address: message.token_network_address,
          transferred_amount: message.transferred_amount,
          type: MessageType.SECRET,
        },
        message_order: 11,
      },
      messageOrder: 11,
      paymentId: payment.paymentId,
      type: ADD_PENDING_PAYMENT_MESSAGE,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("should successfully put a NonClosingBalanceProof", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const payment = {
      isReceived: false,
      initiator: randomPartner,
      amount: "10000000000",
      partner: randomPartner,
      paymentId: "1234",
      secret: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
      tokenNetworkAddress: randomAddress,
      token: randomAddress,
      channelId: 1,
      secret_hash: constantHashes.secrethash,
    };
    const message = {
      type: MessageType.SECRET,
      chain_id: 33,
      message_identifier: "123321",
      payment_identifier: "1231234",
      token_network_address: randomAddress,
      secret:
        "0x2f3a1f9425850b04e2ea7f572594fd2c6a80e3632bdd04144c825a7e49cf21e2",
      nonce: 1,
      channel_identifier: 1,
      transferred_amount: "1000000000000000",
      locked_amount: 0,
      locksroot:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    };

    // Spies
    const spyPack = jest.spyOn(
      packFunctions,
      "getDataToSignForNonClosingBalanceProof"
    );
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyResolver.mockResolvedValue(mockedSignature);
    client.put.mockResolvedValue("Message received");
    spyGetState.mockImplementation(() => store.getState());
    await store.dispatch(
      paymentFunctions.putNonClosingBalanceProof(message, payment)
    );

    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      channelId: payment.channelId,
      nonClosingBp: {
        channel_id: payment.channelId,
        lc_bp_signature: mockedSignature,
        nonce: message.nonce,
        light_client_payment_id: payment.paymentId,
        secret_hash: payment.secret_hash,
        sender: payment.initiator,
        token_network_address: payment.tokenNetworkAddress,
        partner_balance_proof: {
          chain_id: message.chain_id,
          channel_identifier: message.channel_identifier,
          locked_amount: message.locked_amount,
          locksroot: message.locksroot,
          message_identifier: message.message_identifier,
          nonce: message.nonce,
          payment_identifier: message.payment_identifier,
          secret: message.secret,
          token_network_address: message.token_network_address,
          transferred_amount: message.transferred_amount,
          type: MessageType.SECRET,
        },
      },
      token: payment.token,
      type: UPDATE_NON_CLOSING_BP,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("should successfully put a LockExpired (sending payment)", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const data = {
      type: MessageType.SECRET,
      initiator: randomPartner,
      partner: randomPartner,
      paymentId: "1234",
      chainId: 33,
      message_identifier: "123321",
      payment_identifier: "1231234",
      tokenNetworkAddress: randomAddress,
      secret_hash: constantHashes.secrethash,
      nonce: 1,
      channelId: 1,
      transferred_amount: "1000000000000000",
      locked_amount: 0,
      locksroot:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    };

    // Spies
    const spyPack = jest.spyOn(packFunctions, "getDataToSignForLockExpired");
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyResolver.mockResolvedValue(mockedSignature);
    client.put.mockResolvedValue("Message received");
    spyGetState.mockImplementation(() => store.getState());
    await store.dispatch(paymentFunctions.putLockExpired(data));

    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      lockExpired: {
        message_order: 1,
        message_type_value: PAYMENT_EXPIRED,
        payment_id: data.paymentId,
        receiver: data.partner,
        sender: data.initiator,
        message: {
          chain_id: data.chainId,
          channel_identifier: data.channelId,
          locked_amount: data.locked_amount,
          locksroot: data.locksroot,
          message_identifier: data.message_identifier,
          nonce: data.nonce,
          recipient: data.partner,
          secrethash: data.secret_hash,
          signature: mockedSignature,
          token_network_address: data.tokenNetworkAddress,
          transferred_amount: data.transferred_amount,
          type: MessageType.LOCK_EXPIRED,
        },
      },
      paymentId: data.paymentId,
      type: PUT_LOCK_EXPIRED,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("should successfully put a LockExpired (reception of payment)", async () => {
    const store = mockStore(state);

    // Values for payment
    const mockedSignature = "0x123456";
    const data = {
      type: MessageType.SECRET,
      initiator: randomPartner,
      partner: address,
      paymentId: "1234",
      chainId: 33,
      message_identifier: "123321",
      payment_identifier: "1231234",
      tokenNetworkAddress: randomAddress,
      secret_hash: constantHashes.secrethash,
      nonce: 1,
      channelId: 1,
      transferred_amount: "1000000000000000",
      locked_amount: 0,
      locksroot:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      signature: mockedSignature,
    };

    // Spies
    const spyPack = jest.spyOn(packFunctions, "getDataToSignForLockExpired");
    spyPack.mockReturnValue(ethers.constants.HashZero);
    spyGetState.mockImplementation(() => store.getState());
    await store.dispatch(paymentFunctions.putLockExpired(data));
    expect(spyPack).toHaveBeenCalledTimes(0);
    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      lockExpired: {
        message_order: 1,
        message_type_value: PAYMENT_EXPIRED,
        payment_id: data.paymentId,
        receiver: data.partner,
        sender: data.initiator,
        message: {
          chain_id: data.chainId,
          channel_identifier: data.channelId,
          locked_amount: data.locked_amount,
          locksroot: data.locksroot,
          message_identifier: data.message_identifier,
          nonce: data.nonce,
          recipient: data.partner,
          secrethash: data.secret_hash,
          token_network_address: data.tokenNetworkAddress,
          transferred_amount: data.transferred_amount,
          type: MessageType.LOCK_EXPIRED,
        },
      },
      paymentId: data.paymentId,
      type: PUT_LOCK_EXPIRED,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });

  test("can recreate a payment object from a failure message", async () => {
    const store = mockStore(state);
    const data = {
      payment_id: "123",
      isReceived: true,
      transferred_amount: "100000",
      token: randomAddress,
      channel_identifier: "1",
      token_network_address: randomAddress,
      chain_id: 33,
    };

    const spyRecover = jest.spyOn(recover, "signatureRecover");
    const spyToken = jest.spyOn(
      tokenFunctions,
      "getTokenAddressByTokenNetwork"
    );
    spyToken.mockReturnValue(randomAddress);
    spyRecover.mockReturnValue(randomPartner);
    spyGetState.mockImplementation(() => store.getState());
    await store.dispatch(paymentFunctions.recreatePaymentForFailure(data));

    const actions = store.getActions();

    expect(actions.length).toBe(1);
    const expectedAction = {
      type: CREATE_PAYMENT,
      payment: {
        partner: address,
        paymentId: data.payment_id,
        isReceived: true,
        initiator: randomPartner,
        amount: data.transferred_amount,
        token: randomAddress,
        channelId: data.channel_identifier,
        tokenNetworkAddress: data.token_network_address,
        chainId: data.chain_id,
      },
      paymentId: data.payment_id,
      channelId: data.channel_identifier,
      token: randomAddress,
    };
    expect(actions[0]).toStrictEqual(expectedAction);
  });
});
