import * as paymentFunctions from "../../../src/store/functions/payments";
import Store from "../../../src/store";
import { LocalStorageHandler } from "../../../src";
import {
  COMPLETED_PAYMENT,
  EXPIRED,
} from "../../../src/config/paymentConstants";
import {
  PAYMENT_SUCCESSFUL,
  PAYMENT_EXPIRED,
} from "../../../src/config/messagesConstants";

const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";

const partner = "0x29021129F5d038897f01bD4BC050525Ca01a4758";

test("should return sender and receiver (sending)", () => {
  const payment = {
    initiator: address,
    partner,
    isReceived: false,
  };
  const { sender, receiver } = paymentFunctions.getSenderAndReceiver(payment);
  expect(sender).toBe(address);
  expect(receiver).toBe(partner);
});

test("should return sender and receiver (reception)", () => {
  const payment = {
    initiator: address,
    partner,
    isReceived: true,
  };
  const { sender, receiver } = paymentFunctions.getSenderAndReceiver(payment);
  expect(sender).toBe(partner);
  expect(receiver).toBe(address);
});

describe("Operation with store and payments", () => {
  afterEach(() => {
    Store.destroyStore();
  });

  const initStoreWithData = async data => {
    LocalStorageHandler.saveLuminoData(data);
    await Store.initStore(LocalStorageHandler, {});
  };

  test("should return paymentIds", async () => {
    const state = {
      paymentIds: {
        "123": "PENDING",
        "1234": "PENDING",
        "12345": "FAILED",
        "123456": "COMPLETED",
      },
    };
    await initStoreWithData(state);
    const ids = paymentFunctions.getPaymentIds();
    expect(ids).toStrictEqual(state.paymentIds);
  });

  test("should return all payments", async () => {
    const state = {
      payments: {
        completed: {
          "123": { test: "Fake" },
        },
      },
    };
    await initStoreWithData(state);
    const payments = paymentFunctions.getAllPayments();
    expect(payments).toStrictEqual(state.payments);
  });

  test("should return a payment by State and Id", async () => {
    const state = {
      payments: {
        completed: {
          "123": { test: "Fake" },
        },
      },
    };
    await initStoreWithData(state);
    const payment = paymentFunctions.getPaymentByIdAndState(
      COMPLETED_PAYMENT,
      "123"
    );
    expect(payment).toStrictEqual(state.payments.completed[123]);
  });

  test("should return null for an inexistent payment by State and Id", async () => {
    const state = {
      payments: {
        completed: {
          "1234": { test: "Fake" },
        },
      },
    };
    await initStoreWithData(state);
    const payment = paymentFunctions.getPaymentByIdAndState(
      COMPLETED_PAYMENT,
      "123"
    );
    expect(payment).toBeNull();
  });

  test("should return a payment by id on any state", async () => {
    const state = {
      paymentIds: {
        "123": "COMPLETED",
      },
      payments: {
        completed: {
          "123": { test: "Fake" },
        },
      },
    };

    await initStoreWithData(state);
    const payment = paymentFunctions.paymentExistsInAnyState("123");
    expect(payment).toBeTruthy();
  });

  test("should return a pending payment by id", async () => {
    const state = {
      paymentIds: {
        "123": "PENDING",
      },
      payments: {
        pending: {
          "123": { test: "Fake" },
        },
      },
    };

    await initStoreWithData(state);
    const payment = paymentFunctions.getPendingPaymentById("123");
    expect(payment).toBeTruthy();
  });

  test("should return null for a non existent pending paymentID", async () => {
    const state = {
      paymentIds: {
        "123": "PENDING",
      },
      payments: {
        pending: {
          "123": { test: "Fake" },
        },
      },
    };

    await initStoreWithData(state);
    const payment = paymentFunctions.getPendingPaymentById("1234");
    expect(payment).toBeNull();
  });

  test("should return a pending payment in Complete or Pending", async () => {
    const state = {
      paymentIds: {
        "123": "PENDING",
      },
      payments: {
        pending: {
          "123": { test: "Fake" },
        },
        completed: {},
      },
    };

    await initStoreWithData(state);
    const payment = paymentFunctions.isPaymentCompleteOrPending("123");
    expect(payment).toBeTruthy();
  });

  test("should return a completed payment in Complete or Pending", async () => {
    const state = {
      paymentIds: {
        "123": "COMPLETED",
      },
      payments: {
        completed: {
          "123": { test: "Fake" },
        },
        pending: {},
      },
    };

    await initStoreWithData(state);
    const payment = paymentFunctions.isPaymentCompleteOrPending("123");
    expect(payment).toBeTruthy();
  });

  test("should return a failed payment by id", async () => {
    const state = {
      paymentIds: {
        "123": "FAILED",
      },
      payments: {
        failed: {
          "123": { test: "Fake" },
        },
      },
    };

    await initStoreWithData(state);
    const payment = paymentFunctions.getFailedPaymentById("123");
    expect(payment).toBeTruthy();
  });

  test("should return a completed payment by id", async () => {
    const state = {
      paymentIds: {
        "123": "COMPLETED",
      },
      payments: {
        completed: {
          "123": { test: "Fake" },
        },
      },
    };

    await initStoreWithData(state);
    const payment = paymentFunctions.getCompletedPaymentById("123");
    expect(payment).toBeTruthy();
  });

  test("should return a completed flow for a non failed payment", async () => {
    const payment = {
      test: "fakeData",
    };

    const isFailed = paymentFunctions.getPaymentMessageTypeValue(payment);
    expect(isFailed).toBe(PAYMENT_SUCCESSFUL);
  });

  test("should return a expired flow for a expired payment", async () => {
    const payment = {
      test: "fakeData",
      failureReason: EXPIRED,
    };

    const isFailed = paymentFunctions.getPaymentMessageTypeValue(payment);
    expect(isFailed).toBe(PAYMENT_EXPIRED);
  });

  test("should return a NULL for an unknown payment failure", async () => {
    const payment = {
      test: "fakeData",
      failureReason: "WhateverReasonNotInSwitch",
    };

    const isFailed = paymentFunctions.getPaymentMessageTypeValue(payment);
    expect(isFailed).toBeNull();
  });
});
