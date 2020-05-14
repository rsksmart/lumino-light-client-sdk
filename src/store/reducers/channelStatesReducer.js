import { OPEN_CHANNEL } from "../actions/types";
import { CHANNEL_OPENED } from "../../config/channelStates";

const initialState = {};

const channel = (state = initialState, action) => {
  switch (action.type) {
    case OPEN_CHANNEL: {
      const nChannelId = action.channel.channel_identifier;
      const nTokenAdd = action.channel.token_address;
      const nChannel = `${nChannelId}-${nTokenAdd}`;
      const newChannels = { ...state, [nChannel]: CHANNEL_OPENED };
      return newChannels;
    }
    default:
      return state;
  }
};

export default channel;
