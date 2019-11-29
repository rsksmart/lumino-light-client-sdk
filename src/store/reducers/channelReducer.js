import {
  OPEN_CHANNEL,
  NEW_DEPOSIT,
  SET_CHANNEL_CLOSED,
  CHANGE_CHANNEL_BALANCE,
} from "../actions/types";
import { ethers } from "ethers";

const initialState = {};

const channel = (state = initialState, action) => {
  const { bigNumberify } = ethers.utils;
  switch (action.type) {
    case OPEN_CHANNEL:
      const newChannelId = action.channel.channel_identifier;
      const newChannels = { ...state, [newChannelId]: action.channel };
      return newChannels;
    case SET_CHANNEL_CLOSED:
      const closedChannelId = action.channel.channel_identifier;
      const channelsModified = { ...state, [closedChannelId]: action.channel };
      return channelsModified;
    case NEW_DEPOSIT:
      const depositedChannelId = action.channel.channel_identifier;
      const channelsDeposited = {
        ...state,
        [depositedChannelId]: { ...action.channel },
      };
      return channelsDeposited;
    case CHANGE_CHANNEL_BALANCE:
      const { payment } = action;
      const { channelId, isReceived, amount } = payment;
      const bigAmount = bigNumberify(amount);
      const channelBalance = bigNumberify(state[channelId].balance);
      let newBalance = channelBalance.add(bigAmount);
      if (!isReceived) newBalance = channelBalance.sub(bigAmount);
      return {
        ...state,
        [channelId]: { ...state[channelId], balance: newBalance.toString() },
      };
    default:
      return state;
  }
};

export default channel;
