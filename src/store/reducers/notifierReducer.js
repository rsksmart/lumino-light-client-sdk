import {
  SUBSCRIBED_TO_NEW_TOPIC,
  UNSUBSCRIBE_FROM_TOPIC,
  NEW_NOTIFIER,
  SET_LAST_NOTIFICATION_ID,
} from "../actions/types";

const initialState = {
  notifiers: {},
};

const patchNewTopic = (state, action) => {
  const { notifierUrl, topicId } = action;
  const tId = String(topicId);
  const newTopic = {
    ...state,
    notifiers: {
      ...state.notifiers,
      [notifierUrl]: {
        ...state.notifiers[notifierUrl],
        topics: {
          ...state.notifiers[notifierUrl].topics,
          [tId]: tId,
        },
      },
    },
  };
  return newTopic;
};

const notifierReducer = (state = initialState, action) => {
  switch (action.type) {
    case NEW_NOTIFIER:
      const newNotifier = {
        ...state,
        notifiers: {
          ...state.notifiers,
          [action.notifierUrl]: {
            apiKey: action.notifierApiKey,
            topics: {},
            fromNotificationId: 0,
          },
        },
      };
      return newNotifier;
    case SET_LAST_NOTIFICATION_ID:
      const { ids } = action;
      let stateClone = { ...state };
      Object.entries(ids).forEach(([notifier, id]) => {
        stateClone = {
          ...stateClone,
          notifiers: {
            ...stateClone.notifiers,
            [notifier]: {
              ...stateClone.notifiers[notifier],
              fromNotificationId: id,
            },
          },
        };
      });
      return stateClone;
    default:
      return state;
  }
};

export default notifierReducer;
