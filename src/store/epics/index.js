import { of, timer } from 'rxjs';
import { map, pluck, delay, mergeMap, catchError, switchMap, exhaustMap, takeUntil } from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { getTransactionInfo } from './services'

import {
    MESSAGE_POLLING,
    MESSAGE_SENT,
    MESSAGE_POLLING_START,
    MESSAGE_POLLING_STOP,
    MESSAGE_POLLING_ERROR
} from "../actions/types";

const pluckState = (state$, state) => state$.pipe(pluck(state));

const paymentsMonitoredEpic = action$ => {
    const stopPolling$ = action$.pipe(
        ofType(MESSAGE_POLLING_STOP)
    );

    return action$.pipe(
        ofType(MESSAGE_POLLING_START),
        switchMap(({ paymentList }) => timer(1000, 2000).pipe(
            takeUntil(stopPolling$),
            exhaustMap(() => getTransactionInfo(paymentList).pipe(
                map(response => ({
                    type: MESSAGE_POLLING,
                    data: response,
                })),
                catchError(error => of({
                    type: MESSAGE_POLLING_ERROR,
                    error
                }))
            ))
        )),
    );
};

// const paymentsMonitoredEpic = action$ => action$.pipe(
//     ofType(MESSAGE_POLLING_START),
//     mergeMap(({ paymentList }) => {
//         return getTransactionInfo(paymentList).pipe(
//             map(response => ({
//                 type: MESSAGE_POLLING,
//                 data: response,
//             })),
//             catchError(error => of({
//                 type: MESSAGE_POLLING_ERROR,
//                 error
//             }))
//         )
//     }),
// );

export {
    paymentsMonitoredEpic
}