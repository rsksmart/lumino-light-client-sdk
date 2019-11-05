import {
    Observable,
    of
} from 'rxjs';
import {
    map,
    pluck,
} from 'rxjs/operators';
import {
    MESSAGE_POLLING,
    MESSAGE_SENT,
    MESSAGE_POLLING_START,
    MESSAGE_POLLING_STOP
} from "../actions/types";

import fakePaymentData from './tmpFakeData';

import { ajax } from 'rxjs/ajax';

const ENDPOINT = '/api/payments_light';

const fakeResp = fakePaymentData;

const getTransactionInfo = (payments) => {
    // restful url is not ready yet.

    // return ajax({
    //     url: ENDPOINT,
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'rxjs-custom-header': 'Rxjs'
    //     },
    //     body: {
    //         payments
    //     }
    // })

    return of([...fakeResp])
};

const pluckState = (state$, state) => state$.pipe(pluck(state));

const paymentsMonitoredEpic = (action$, state$) => {
    action$
        .ofType(MESSAGE_POLLING_START)
        .switchMap(() =>
            Observable
                .timer(1000, 2000)
                .takeUntil(action$.ofType(MESSAGE_POLLING_STOP))
                .exhaustMap(() => {
                    const payments = pluckState('payments');
                    getTransactionInfo(payments)
                        .pipe(
                            map(response => ({
                                  type: MESSAGE_POLLING,
                                  data: response,
                            }))
                        )
                })
        )
};

export default paymentsMonitoredEpic;