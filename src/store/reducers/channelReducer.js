import {
  OPEN_CHANNEL,
  NEW_DEPOSIT,
  SET_CHANNEL_CLOSED,
  CHANGE_CHANNEL_BALANCE,
  UPDATE_NON_CLOSING_BP,
  OPEN_CHANNEL_VOTE,
  DELETE_CHANNEL_FROM_SDK,
} from "../actions/types";
import { ethers } from "ethers";
import { SDK_CHANNEL_STATUS } from "../../config/channelStates";
import { VOTE_TYPE } from "../../config/notifierConstants";
import { getNumberOfNotifiers } from "../functions/notifiers";

const initialState = {};

const getChannelKey = channelData => {
  const id = channelData.channel_identifier;
  const tokenAddr = channelData.token_address;
  const key = `${id}-${tokenAddr}`;
  return key;
};

const getPaymentChannelKey = data => {
  const { channelId, token } = data;
  return `${channelId}-${token}`;
};

const createChannel = (state, channel, key) => ({
  ...state,
  [key]: {
    ...channel,
    offChainBalance: "0",
    receivedTokens: "0",
    sentTokens: "0",
    sdk_status: SDK_CHANNEL_STATUS.CHANNEL_AWAITING_NOTIFICATION,
    votes: {
      open: {},
      close: {},
    },
  },
});

const addVote = (channel, vote, voteType) => {
  switch (voteType) {
    case VOTE_TYPE.OPEN_CHANNEL_VOTE:
      return {
        ...channel,
        votes: {
          ...channel.votes,
          open: {
            ...channel.votes.open,
            [vote.notifier]: vote.shouldOpen,
          },
        },
      };
    default:
      return channel;
  }
};

const channel = (state = initialState, action) => {
  const { bigNumberify } = ethers.utils;
  switch (action.type) {
    case OPEN_CHANNEL:
      const nChannelKey = getChannelKey(action.channel);
      // We don't open if it is already there
      if (state[nChannelKey]) return state;
      const newChannels = createChannel(state, action.channel, nChannelKey);
      return newChannels;

    // Notifiers vote for new channel
    case OPEN_CHANNEL_VOTE:
      const { notifier, shouldOpen } = action;
      const ovChannelKey = getChannelKey(action.channel);
      let ovChannel = state[ovChannelKey];
      // If the channel is not present, create it
      if (!ovChannel) {
        ovChannel = createChannel(state, action.channel, ovChannelKey);
      } else {
        ovChannel = state;
      }

      // Add the corresponding vote, whether is positive or not
      ovChannel[ovChannelKey] = addVote(
        ovChannel[ovChannelKey],
        { notifier, shouldOpen },
        VOTE_TYPE.OPEN_CHANNEL_VOTE
      );

      // Check for valid votes and quantity of notifiers
      const openVotesQuantity = Object.values(
        ovChannel[ovChannelKey].votes.open
      ).filter(v => v).length;
      const { numberOfNotifiers } = action;

      // If we have the half + 1 votes of approval, we open the channel
      if (openVotesQuantity >= Math.ceil(numberOfNotifiers / 2))
        ovChannel[ovChannelKey].sdk_status = SDK_CHANNEL_STATUS.CHANNEL_OPENED;

      return ovChannel;

    case SET_CHANNEL_CLOSED:
      const cChannelKey = getChannelKey(action.channel);

      const channelsModified = {
        ...state,
        [cChannelKey]: {
          ...state[cChannelKey],
          ...action.channel,
        },
      };

      return channelsModified;
    case NEW_DEPOSIT:
      const dChannel = getChannelKey(action.channel);

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
    case CHANGE_CHANNEL_BALANCE: {
      const { payment } = action;
      const { isReceived, secretMessageId, messages } = payment;
      const ccbChannel = getPaymentChannelKey(payment);
      // We get the BP
      if (!state[ccbChannel]) return state;
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
    }
    case UPDATE_NON_CLOSING_BP:
      const ncbpChannel = getPaymentChannelKey(action);
      return {
        ...state,
        [ncbpChannel]: {
          ...state[ncbpChannel],
          nonClosingBp: action.nonClosingBp,
        },
      };
    case DELETE_CHANNEL_FROM_SDK:
      const stateClone = { ...state };
      const dChannelKey = getChannelKey({
        channel_identifier: action.id,
        token_address: action.token_address,
      });

      delete stateClone[dChannelKey];
      return stateClone;
    default:
      return state;
  }
};

export default channel;
