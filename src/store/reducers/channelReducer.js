import {
  OPEN_CHANNEL,
  NEW_DEPOSIT,
  SET_CHANNEL_CLOSED,
  CHANGE_CHANNEL_BALANCE,
  UPDATE_NON_CLOSING_BP,
} from "../actions/types";
import { ethers } from "ethers";

const initialState = {};

const channel = (state = initialState, action) => {
  const { bigNumberify } = ethers.utils;
  switch (action.type) {
    case OPEN_CHANNEL:
      const nChannelId = action.channel.channel_identifier;
      const nTokenAdd = action.channel.token_address;
      const nChannel = `${nChannelId}-${nTokenAdd}`;
      const newChannels = {
        ...state,
        [nChannel]: {
          ...action.channel,
          offChainBalance: "0",
          receivedTokens: "0",
          sentTokens: "0",
        },
      };
      return newChannels;
    case SET_CHANNEL_CLOSED:
      const cChannelId = action.channel.channel_identifier;
      const cTokenAdd = action.channel.token_address;
      const cChannel = `${cChannelId}-${cTokenAdd}`;

      const channelsModified = {
        ...state,
        [cChannel]: {
          ...state[cChannel],
          ...action.channel,
        },
      };

      return channelsModified;
    case NEW_DEPOSIT:
      const dChannelId = action.channel.channel_identifier;
      const dTokenAdd = action.channel.token_address;
      const dChannel = `${dChannelId}-${dTokenAdd}`;

      const chSentTokens = bigNumberify(state[dChannel].sentTokens || 0);
      const chReceivedTokens = bigNumberify(
        state[dChannel].receivedTokens || 0
      );
      const chBalance = bigNumberify(String(action.channel.total_deposit));

      const channelsDeposited = {
        ...state,
        [dChannel]: {
          ...state[dChannel],
          ...action.channel,
          offChainBalance: chBalance
            .add(chReceivedTokens)
            .sub(chSentTokens)
            .toString(),
        },
      };
      return channelsDeposited;
    case CHANGE_CHANNEL_BALANCE:
      const { payment } = action;
      const {
        channelId,
        isReceived,
        token: cbpTokenAdd,
        secretMessageId,
        messages,
      } = payment;
      const ccbChannel = `${channelId}-${cbpTokenAdd}`;
      // We get the BP
      const amount = messages[secretMessageId].message.transferred_amount;
      // We parse the amounts as BN
      const bigAmount = bigNumberify(String(amount));
      const channelBalance = bigNumberify(
        String(state[ccbChannel].total_deposit)
      );
      let channelSent = bigNumberify(state[ccbChannel].sentTokens || 0);
      let channelReceived = bigNumberify(state[ccbChannel].receivedTokens || 0);

      // We calculate the accumulated, + for reception, - for sending
      if (isReceived) channelReceived = bigAmount;
      if (!isReceived) channelSent = bigAmount;
      // Return the state with the balances
      return {
        ...state,
        [ccbChannel]: {
          ...state[ccbChannel],
          offChainBalance: channelBalance
            .add(channelReceived)
            .sub(channelSent)
            .toString(),
          receivedTokens: channelReceived.toString(),
          sentTokens: channelSent.toString(),
        },
      };
    case UPDATE_NON_CLOSING_BP:
      const ncbpChannelId = action.channelId;
      const ncbpTokenAdd = action.token;
      const ncbpChannel = `${ncbpChannelId}-${ncbpTokenAdd}`;
      return {
        ...state,
        [ncbpChannel]: {
          ...state[ncbpChannel],
          nonClosingBp: action.nonClosingBp,
        },
      };
    default:
      return state;
  }
};

export default channel;
