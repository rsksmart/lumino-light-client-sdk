import Store from "../index";

export const getChannelsState = () => {
  const store = Store.getStore();
  const { channelStates } = store.getState();
  return channelStates;
};

export const getChannelByIdAndToken = (id, token) => {
  const store = Store.getStore();
  const { channelReducer: channels } = store.getState();
  return channels[`${id}-${token}`];
};
