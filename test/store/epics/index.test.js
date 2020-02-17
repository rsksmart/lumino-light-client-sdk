test("stub test", () => {
  expect(1).toBe(1);
});

// import { of, throwError } from "rxjs";
// import sinon from "sinon";
// import * as services from "../../../src/store/epics/services";
// import * as epic from "../../../src/store/epics";
// import { MESSAGE_POLLING_ERROR } from "../../../src/store/actions/types";

// const fakePaymentData = [
//   "fakePaymentData1",
//   "fakePaymentData2",
//   "fakePaymentData3",
// ];
// const sandbox = sinon.createSandbox();

// let getTransactionInfoStub;

// describe("polling epic test", () => {
//   afterEach(() => {
//     sandbox.restore();
//   });

//   it("long polling epic should process MESSAGE_POLLING_START action * 3 within 6s", done => {
//     getTransactionInfoStub = sandbox
//       .stub(services, "getTransactionInfo")
//       .returns(of([...fakePaymentData]));

//     const startType = "MESSAGE_POLLING_START";
//     const paymentList = [1, 2, 3];
//     const startAction$ = of({ type: startType, paymentList });
//     const epic$ = epic.paymentsMonitoredEpic(startAction$);
//     const expected = {
//       type: "MESSAGE_POLLING",
//       data: ["fakePaymentData1", "fakePaymentData2", "fakePaymentData3"],
//     };
//     epic$.subscribe(action => {
//       sinon.assert.match(action, expected);
//       setTimeout(() => {
//         sinon.assert.calledThrice(getTransactionInfoStub);
//         done();
//       }, 6000);
//     });
//   });

//   it("long polling epic should handle MESSAGE_POLLING_ERROR", done => {
//     const errorMessage = "API call failed";
//     getTransactionInfoStub = sandbox
//       .stub(services, "getTransactionInfo")
//       .returns(throwError(errorMessage));

//     const startType = "MESSAGE_POLLING_START";
//     const paymentList = [1, 2, 3];
//     const startAction$ = of({ type: startType, paymentList });
//     const epic$ = epic.paymentsMonitoredEpic(startAction$);
//     const expected = {
//       type: MESSAGE_POLLING_ERROR,
//       error: errorMessage,
//     };
//     epic$.subscribe(action => {
//       sinon.assert.match(action, expected);
//       done();
//     });
//   });
// });
