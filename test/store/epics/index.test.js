import { of, throwError } from 'rxjs';
import sinon from 'sinon';
import * as services from '../../../src/store/epics/services';
import * as epic from '../../../src/store/epics';

const fakePaymentData = ['fakePaymentData1', 'fakePaymentData2', 'fakePaymentData3'];
const sandbox = sinon.createSandbox();

let getTransactionInfoStub;

describe('polling epic test', () => {

    afterEach(() => {
        sandbox.restore();
    });

    it('long polling epic should process MESSAGE_POLLING_START action * 3 within 6s', (done) => {
        getTransactionInfoStub = sandbox.stub(services, 'getTransactionInfo').returns(of([...fakePaymentData]));

        const startType = 'MESSAGE_POLLING_START';
        const endType = 'MESSAGE_POLLING_STOP';
        const paymentList = [1, 2, 3];
        const startAction$ = of({ type: startType, paymentList });
        const endAction$ = of({ type: endType });
        const epic$ = epic.paymentsMonitoredEpic(startAction$);

        epic$.subscribe(() => {
            setTimeout(() => {
                sinon.assert.calledThrice(getTransactionInfoStub);
                done();
            }, 6000);
        })
    });
});