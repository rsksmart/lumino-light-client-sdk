import {
  SUBSCRIBED_TO_NEW_TOPIC,
  UNSUBSCRIBE_FROM_TOPIC,
  NEW_NOTIFIER,
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
          },
        },
      };
      return newNotifier;
    case SUBSCRIBED_TO_NEW_TOPIC:
      return patchNewTopic(state, action);
    case UNSUBSCRIBE_FROM_TOPIC:
      const deletedTopic = { ...state };
      delete deletedTopic[action.topicId];
      return deletedTopic;
    default:
      return state;
  }
};

export default notifierReducer;
