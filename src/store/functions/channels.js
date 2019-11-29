import Store from "../index";

export const getChannelsState = () => {
  const store = Store.getStore();
  const { channelStates } = store.getState();
  return channelStates;
};

export const getChannelById = id => {
  const store = Store.getStore();
  const { channelReducer: channels } = store.getState();
  return channels[id];
};
