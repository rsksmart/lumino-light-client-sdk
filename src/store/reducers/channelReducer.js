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
      const newChannels = {
        ...state,
        [newChannelId]: {
          ...action.channel,
          offChainBalance: "0",
          receivedTokens: "0",
          sentTokens: "0",
        },
      };
      return newChannels;
    case SET_CHANNEL_CLOSED:
      const closedChannelId = action.channel.channel_identifier;
      const channelsModified = {
        ...state,
        [closedChannelId]: { ...state[closedChannelId], ...action.channel },
      };
      return channelsModified;
    case NEW_DEPOSIT:
      const depositedChannelId = action.channel.channel_identifier;
      const channelsDeposited = {
        ...state,
        [depositedChannelId]: {
          ...state[depositedChannelId],
          ...action.channel,
        },
      };
      return channelsDeposited;
    case CHANGE_CHANNEL_BALANCE:
      const { payment } = action;
      const { channelId, isReceived } = payment;
      // We get the BP
      const BP = payment.messages[11].message;
      // We parse the amounts as BN
      const bigAmount = bigNumberify(BP.transferred_amount);
      const channelBalance = bigNumberify(state[channelId].balance);
      let channelSent = bigNumberify(state[channelId].sentTokens || 0);
      let channelReceived = bigNumberify(state[channelId].receivedTokens || 0);

      // We calculate the accumulated, + for reception, - for sending
      if (isReceived) channelReceived = bigAmount;
      if (!isReceived) channelSent = bigAmount;
      // Return the state with the balances
      return {
        ...state,
        [channelId]: {
          ...state[channelId],
          offChainBalance: channelBalance
            .add(channelReceived)
            .sub(channelSent)
            .toString(),
          receivedTokens: channelReceived.toString(),
          sentTokens: channelSent.toString(),
        },
      };
    default:
      return state;
  }
};

export default channel;
