import {OPEN_CHANNEL, NEW_DEPOSIT} from '../actions/types';

const initialState = [];

const channel = (state = initialState, action) => {
  switch (action.type) {
    case OPEN_CHANNEL:
      return state.concat({...action.channel});
    case NEW_DEPOSIT:
      const actionChannelId = action.channel.channel_identifier;
      const newData = state.map(e =>
        e.channel_identifier === actionChannelId ? action.channel : e,
      );
      debugger;
      return newData;
    default:
      return state;
  }
};

export default channel;
