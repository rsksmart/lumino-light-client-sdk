import Store from "../index";
import { findMaxChannelId } from "../../utils/functions";

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

export const getLatestChannelByPartnerAndToken = (partner, token) => {
  const store = Store.getStore();
  const { channelReducer: channels } = store.getState();
  // We don't want channels outside the specified token
  const channelsOnToken = Object.keys(channels)
    .map(c => {
      if (c.includes(token)) return channels[c];
      return null;
    })
    .filter(e => {
      if (e) return e;
    });
  // We also don't care about channels without that partner
  const channelsWithPartner = channelsOnToken.filter(c => {
    if (c.partner_address === partner) return c;
  });
  // We have to get the latest channel id
  const latestChannelId = findMaxChannelId(channelsWithPartner);
  return channels[`${latestChannelId}-${token}`];
};
