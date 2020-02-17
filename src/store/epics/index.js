import { of, timer } from "rxjs";
import {
  map,
  catchError,
  switchMap,
  exhaustMap,
  takeUntil,
} from "rxjs/operators";
import { ofType, combineEpics } from "redux-observable";
import { getTransactionInfo, getNotificationsInfo } from "./services";

import {
  MESSAGE_POLLING,
  MESSAGE_POLLING_START,
  MESSAGE_POLLING_STOP,
  MESSAGE_POLLING_ERROR,
  STOP_NOTIFICATIONS_POLLING,
  START_NOTIFICATIONS_POLLING,
  NOTIFICATIONS_POLLING_ERROR,
  NOTIFICATIONS_POLLING,
} from "../actions/types";

const paymentsMonitoredEpic = action$ => {
  const stopPolling$ = action$.pipe(ofType(MESSAGE_POLLING_STOP));
  // TODO: Change conditionally the timer
  return action$.pipe(
    ofType(MESSAGE_POLLING_START),
    switchMap(() =>
      timer(1000, 2000).pipe(
        takeUntil(stopPolling$),
        exhaustMap(() =>
          getTransactionInfo().pipe(
            map(data => ({
              type: MESSAGE_POLLING,
              data,
            })),
            catchError(error =>
              of({
                type: MESSAGE_POLLING_ERROR,
                error,
              })
            )
          )
        )
      )
    )
  );
};

const notificationsMonitoredEpic = action$ => {
  const stopPolling$ = action$.pipe(ofType(STOP_NOTIFICATIONS_POLLING));
  // TODO: Change conditionally the timer within other networks
  return action$.pipe(
    ofType(START_NOTIFICATIONS_POLLING),
    switchMap(() =>
      timer(1000, 1000).pipe(
        takeUntil(stopPolling$),
        exhaustMap(() =>
          getNotificationsInfo().pipe(
            map(data => ({
              type: NOTIFICATIONS_POLLING,
              data,
            })),
            catchError(error => {
              console.error(error);
              of({
                type: NOTIFICATIONS_POLLING_ERROR,
                error,
              });
            })
          )
        )
      )
    )
  );
};

const epics = combineEpics(paymentsMonitoredEpic, notificationsMonitoredEpic);

export default epics;
