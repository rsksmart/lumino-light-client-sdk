import { of, throwError } from 'rxjs';
import sinon from 'sinon';
import * as epic from '../../../src/store/epics';
import fakePaymentData from '../../../src/store/epics/tmpFakeData';

const sandbox = sinon.createSandbox();

let getTransactionInfoStub;

describe('polling epic test', () => {
    beforeEach(() => {
        sandbox.stub(epic, 'getTransactionInfo').returns(of([...fakePaymentData]));
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('long polling epic should process MESSAGE_POLLING_START action', (done) => {
        const startType = 'MESSAGE_POLLING_START';
        const endType = 'MESSAGE_POLLING_STOP';
        const paymentList = [1, 2, 3];
        const startAction$ = of({ type: startType, paymentList });
        const endAction$ = of({ type: endType });
        const epic$ = epic.paymentsMonitoredEpic(startAction$);

        epic$.subscribe(() => {
            done();
        })
    });
});