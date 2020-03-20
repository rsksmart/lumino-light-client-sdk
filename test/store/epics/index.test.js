import { of, throwError } from "rxjs";
import * as services from "../../../src/store/epics/services";
import * as epic from "../../../src/store/epics";
import { MESSAGE_POLLING_ERROR } from "../../../src/store/actions/types";

const fakePaymentData = [
  "fakePaymentData1",
  "fakePaymentData2",
  "fakePaymentData3",
];

describe("polling epic test", () => {
  afterEach(() => {
    jest.setTimeout(5000);
  });

  test("long polling epic should process MESSAGE_POLLING_START action * 3 within 5s", () => {
    jest.setTimeout(10000);
    const spyGetPaymentMessages = jest.spyOn(services, "getTransactionInfo");
    spyGetPaymentMessages.mockReturnValue(of([...fakePaymentData]));

    const startType = "MESSAGE_POLLING_START";
    const paymentList = [1, 2, 3];
    const startAction$ = of({ type: startType, paymentList });
    const epic$ = epic.paymentsMonitoredEpic(startAction$);
    const expected = {
      type: "MESSAGE_POLLING",
      data: ["fakePaymentData1", "fakePaymentData2", "fakePaymentData3"],
    };
    epic$.subscribe(action => {
      expect(action).toStrictEqual(expected);
      setTimeout(() => {
        expect(spyGetPaymentMessages).toBeCalledTimes(3);
        spyGetPaymentMessages.mockReset();
        spyGetPaymentMessages.mockClear();
      }, 5000);
    });
  });

  test("long polling epic should handle MESSAGE_POLLING_ERROR", () => {
    const errorMessage = "API call failed";

    const spyGetPaymentMessages = jest.spyOn(services, "getTransactionInfo");
    spyGetPaymentMessages.mockReturnValueOnce(throwError(errorMessage));

    const startType = "MESSAGE_POLLING_START";
    const paymentList = [1, 2, 3];
    const startAction$ = of({ type: startType, paymentList });
    const epic$ = epic.paymentsMonitoredEpic(startAction$);
    const expected = {
      type: MESSAGE_POLLING_ERROR,
      error: errorMessage,
    };
    epic$.subscribe(action => {
      expect(action).toStrictEqual(expected);
    });
  });
});
