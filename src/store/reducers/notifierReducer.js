import {
  SUBSCRIBED_TO_NEW_TOPIC,
  NEW_NOTIFIER,
  SET_LAST_NOTIFICATION_ID,
  REMOVE_NOTIFIER,
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

const mergeNewNotifier = (action, state) => {
  const { notifierUrl, notifierApiKey } = action;

  // If the notifier exists, just merge it
  // DO NOT OVERRIDE TOPICS, just the api key
  if (state.notifiers[notifierUrl])
    return {
      ...state,
      notifiers: {
        ...state.notifiers,
        [notifierUrl]: {
          ...state.notifiers[notifierUrl],
          apiKey: notifierApiKey,
        },
      },
    };

  // If it doesn't we add it
  return {
    ...state,
    notifiers: {
      ...state.notifiers,
      [notifierUrl]: {
        apiKey: notifierApiKey,
        topics: {},
        fromNotificationId: 0,
      },
    },
  };
};

const notifierReducer = (state = initialState, action) => {
  switch (action.type) {
    case NEW_NOTIFIER: {
      return mergeNewNotifier(action, state);
    }
    case SET_LAST_NOTIFICATION_ID: {
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
    }
    case SUBSCRIBED_TO_NEW_TOPIC:
      return patchNewTopic(state, action);
    case REMOVE_NOTIFIER: {
      const { url } = action;
      let notifierWithRemotion = { ...state };
      delete notifierWithRemotion.notifiers[url];
      return notifierWithRemotion;
    }
    default:
      return state;
  }
};

export default notifierReducer;
