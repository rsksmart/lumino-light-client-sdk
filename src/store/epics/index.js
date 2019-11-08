import {
    Observable,
    of
} from 'rxjs';
import {
    map,
    pluck,
    delay
} from 'rxjs/operators';
import {
    MESSAGE_POLLING,
    MESSAGE_SENT,
    MESSAGE_POLLING_START,
    MESSAGE_POLLING_STOP,
    MESSAGE_POLLING_ERROR
} from "../actions/types";

import fakePaymentData from './tmpFakeData';

import { ajax } from 'rxjs/ajax';

const ENDPOINT = '/api/payments_light';

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

    return of([...fakePaymentData]).pipe(delay(350))
};

const pluckState = (state$, state) => state$.pipe(pluck(state));

const paymentsMonitoredEpic = action$ => action$.pipe(
    ofType(MESSAGE_POLLING_START),
    switchMap(({ paymentList }) => {
        timer(1000, 2000).pipe(
            takeUntil(action$.ofType(MESSAGE_POLLING_STOP)),
            exhaustMap(() => {
                return getTransactionInfo(paymentList).pipe(
                    map(response => ({
                        type: MESSAGE_POLLING,
                        data: response,
                    })),
                    catchError(error => of({
                        type: MESSAGE_POLLING_ERROR,
                        error
                    }))
                )
            })
        )
    }),
);

export {
    paymentsMonitoredEpic,
    getTransactionInfo
}