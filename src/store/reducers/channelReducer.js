import {
  OPEN_CHANNEL,
  NEW_DEPOSIT,
  SET_CHANNEL_CLOSED,
  CHANGE_CHANNEL_BALANCE,
  UPDATE_NON_CLOSING_BP,
  OPEN_CHANNEL_VOTE,
  DELETE_CHANNEL_FROM_SDK,
  CLOSE_CHANNEL_VOTE,
  SET_CHANNEL_AWAITING_CLOSE,
} from "../actions/types";
import { ethers } from "ethers";
import { SDK_CHANNEL_STATUS, CHANNEL_WAITING_FOR_CLOSE } from "../../config/channelStates";
import { VOTE_TYPE } from "../../config/notifierConstants";

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

const createChannel = (state, channel, key, hubAnswered = false) => ({
  ...state,
  [key]: {
    ...channel,
    hubAnswered,
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
    case VOTE_TYPE.CLOSE_CHANNEL_VOTE:
      return {
        ...channel,
        votes: {
          ...channel.votes,
          close: {
            ...channel.votes.close,
            [vote.notifier]: vote.shouldClose,
          },
        },
      };
    default:
      return channel;
  }
};

const checkIfChannelCanBeOpened = (channel, numberOfNotifiers) => {
  // If we have the half + 1 votes of approval, we open the channel
  // Also we need the hub to have answered the request and we opened the channel
  const openVotesQuantity = Object.values(channel.votes.open).filter(v => v)
    .length;

  const { openedByUser, hubAnswered } = channel;
  // If user is the opener the hub mas have answered, if not we can open it with the votes alone.
  const canBeOpened = !openedByUser || (openedByUser && hubAnswered);

  // Needed votes to be opened
  const neededVotes = Math.ceil(numberOfNotifiers / 2);

  if (openVotesQuantity >= neededVotes && canBeOpened)
    channel.sdk_status = SDK_CHANNEL_STATUS.CHANNEL_OPENED;
  return { ...channel };
};

const channel = (state = initialState, action) => {
  const { bigNumberify } = ethers.utils;
  switch (action.type) {
    case OPEN_CHANNEL: {
      const nChannelKey = getChannelKey(action.channel);
      // We don't open if it is already there
      if (state[nChannelKey]) {
        let channelWithResponse = {
          ...state[nChannelKey],
          hubAnswered: true,
          openedByUser: true,
        };
        const { numberOfNotifiers } = action;
        
        channelWithResponse = checkIfChannelCanBeOpened(
          channelWithResponse,
          numberOfNotifiers
        );
        return { ...state, [nChannelKey]: channelWithResponse };
      }
      const newChannels = createChannel(
        state,
        action.channel,
        nChannelKey,
        true
      );
      return newChannels;
    }

    // Notifiers vote for new channel
    case OPEN_CHANNEL_VOTE: {
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

      const { numberOfNotifiers } = action;

      ovChannel[ovChannelKey] = checkIfChannelCanBeOpened(
        ovChannel[ovChannelKey],
        numberOfNotifiers
      );

      return ovChannel;
    }

    case SET_CHANNEL_CLOSED: {
      const cChannelKey = getChannelKey(action.channel);

      const channelsModified = {
        ...state,
        [cChannelKey]: {
          ...state[cChannelKey],
          ...action.channel,
        },
      };
      return channelsModified;
    }

    case NEW_DEPOSIT: {
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
    }
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
    case UPDATE_NON_CLOSING_BP: {
      const ncbpChannel = getPaymentChannelKey(action);
      return {
        ...state,
        [ncbpChannel]: {
          ...state[ncbpChannel],
          nonClosingBp: action.nonClosingBp,
        },
      };
    }
    case DELETE_CHANNEL_FROM_SDK: {
      const stateClone = { ...state };
      const dChannelKey = getChannelKey({
        channel_identifier: action.id,
        token_address: action.token_address,
      });

      delete stateClone[dChannelKey];
      return stateClone;
    }
    case CLOSE_CHANNEL_VOTE: {
      const { notifier, shouldClose } = action;
      const channelKey = getChannelKey(action.channel);
      const newState = { ...state };

      // Add the corresponding vote, whether is positive or not
      newState[channelKey] = addVote(
        state[channelKey],
        { notifier, shouldClose },
        VOTE_TYPE.CLOSE_CHANNEL_VOTE
      );

      // Check for valid votes and quantity of notifiers
      const openVotesQuantity = Object.values(
        newState[channelKey].votes.close
      ).filter(v => v).length;
      const { numberOfNotifiers } = action;

      // If we have the half + 1 votes of approval, we close the channel
      if (openVotesQuantity >= Math.ceil(numberOfNotifiers / 2))
        newState[channelKey].sdk_status = SDK_CHANNEL_STATUS.CHANNEL_CLOSED;

      return newState;
    }
    case SET_CHANNEL_AWAITING_CLOSE: {
      const channelKey = getChannelKey(action.channel); 
      const newState = { ...state };
      newState[channelKey].sdk_status = CHANNEL_WAITING_FOR_CLOSE;
      return newState;
    }
    default:
      return state;
  }
};

export default channel;
