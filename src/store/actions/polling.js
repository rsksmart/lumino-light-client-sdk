import { MESSAGE_POLLING_STOP, STOP_NOTIFICATIONS_POLLING } from "./types";

export const stopHubPolling = () => dispatch =>
  dispatch({ type: MESSAGE_POLLING_STOP });

export const stopNotifierPolling = () => dispatch =>
  dispatch({ type: STOP_NOTIFICATIONS_POLLING });

export const stopAllPolling = () => dispatch => {
  dispatch({ type: MESSAGE_POLLING_STOP });
  dispatch({ type: STOP_NOTIFICATIONS_POLLING });
};
