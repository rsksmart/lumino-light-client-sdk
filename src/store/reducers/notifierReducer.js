import {
  SUBSCRIBED_TO_NEW_TOPIC,
  UNSUBSCRIBE_FROM_TOPIC,
} from "../actions/types";

const initialState = {};

const notifierReducer = (state = initialState, action) => {
  switch (action.type) {
    case SUBSCRIBED_TO_NEW_TOPIC:
      const newTopic = { ...state, [action.topicId]: action.topicId };
      return newTopic;
    case UNSUBSCRIBE_FROM_TOPIC:
      const deletedTopic = { ...state };
      delete deletedTopic[action.topicId];
      return deletedTopic;
    default:
      return state;
  }
};

export default notifierReducer;
