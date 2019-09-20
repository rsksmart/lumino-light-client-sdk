import {
  OPEN_CHANNEL,
  NEW_DEPOSIT,
  SET_CHANNEL_CLOSED,
  CREATE_PAYMENT
} from "../actions/types";

const initialState = [];

const channel = (state = initialState, action) => {
  switch (action.type) {
    case OPEN_CHANNEL:
      return state.concat({ ...action.channel });
    case NEW_DEPOSIT:
    case SET_CHANNEL_CLOSED:
      const actionChannelId = action.channel.channel_identifier;
      const newData = state.map(e =>
        e.channel_identifier === actionChannelId
          ? { ...e, ...action.channel }
          : e
      );
      return newData;
    case CREATE_PAYMENT:
      const actionChannelId2 = action.payment.channel_identifier;
      const newData2 = state.map(e =>
        e.channel_identifier === actionChannelId2
          ? { ...e, ...action.channel }
          : e
      );
      return newData2;
    default:
      return state;
  }
};

export default channel;
