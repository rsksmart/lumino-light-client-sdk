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
} from "../../../src/store/actions/types";
import { MessageType } from "../../../src/config/messagesConstants";
import { EXPIRED } from "../../../src/config/paymentConstants";
import { getRandomBN } from "../../../src/utils/functions";

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
});
