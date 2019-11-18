import {
  OPEN_CHANNEL,
  NEW_DEPOSIT,
  SET_CHANNEL_CLOSED
} from "../actions/types";

const initialState = {};

const channel = (state = initialState, action) => {
  switch (action.type) {
    case OPEN_CHANNEL:
      const newChannelId = action.channel.channel_identifier;
      const newChannels = { ...state, [newChannelId]: action.channel };
      return newChannels;
    case NEW_DEPOSIT:
    case SET_CHANNEL_CLOSED:
      const closedChannelId = action.channel.channel_identifier;
      const channelsModified = { ...state, [closedChannelId]: action.channel };
      return channelsModified;
    default:
      return state;
  }
};

export default channel;
