import { OPEN_CHANNEL } from "../actions/types";
import { CHANNEL_OPENED } from "../../config/channelStates";

const initialState = {};

const channel = (state = initialState, action) => {
  switch (action.type) {
    case OPEN_CHANNEL:
      const newChannels = { ...state, [action.channelId]: CHANNEL_OPENED };
      return newChannels;
    default:
      return state;
  }
};

export default channel;
