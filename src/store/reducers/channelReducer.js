import {OPEN_CHANNEL, NEW_DEPOSIT, SET_CHANNEL_CLOSED} from '../actions/types';

const initialState = [];

const channel = (state = initialState, action) => {
  switch (action.type) {
    case OPEN_CHANNEL:
      return state.concat({...action.channel});
    case NEW_DEPOSIT:
    case SET_CHANNEL_CLOSED:
      const actionChannelId = action.channel.channel_identifier;
      const newData = state.map(e =>
        e.channel_identifier === actionChannelId ? action.channel : e,
      );
      return newData;
    default:
      return state;
  }
};

export default channel;
