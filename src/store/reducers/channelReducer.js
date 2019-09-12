import {OPEN_CHANNEL, NEW_DEPOSIT} from '../actions/types';

const initialState = [];

const channel = (state = initialState, action) => {
  switch (action.type) {
    case OPEN_CHANNEL:
      return state.concat({...action.channel, balance: 0});
    case NEW_DEPOSIT:
      const i = state.findIndex(e => e.channelId === action.data.channelId);
      if (i != -1) {
        const newChannelData = [...state];
        newChannelData[i].balance = action.data.balance;
        return newChannelData;
      }
    default:
      return state;
  }
};

export default channel;
