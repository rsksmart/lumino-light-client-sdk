import {
  OPEN_CHANNEL,
  NEW_DEPOSIT,
  SET_CHANNEL_CLOSED,
  CREATE_PAYMENT,
  MESSAGE_POLLING,
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
      const actionChannelId2 = action.payment.message.channel_identifier;
      const newData2 = state.map(e =>
        e.channel_identifier === actionChannelId2
          ? {
              ...e,
              payments: e.payments.concat(action.payment),
            }
          : e
      );
      return newData2;
    case MESSAGE_POLLING:
      console.log(action);
      return state;
    default:
      return state;
  }
};

export default channel;