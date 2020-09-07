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
  ADD_CHANNEL_WAITING_FOR_OPENING,
} from "../actions/types";
import { ethers } from "ethers";
import {
  SDK_CHANNEL_STATUS,
  CHANNEL_WAITING_FOR_CLOSE,
  CHANNEL_WAITING_OPENING,
} from "../../config/channelStates";
import { VOTE_TYPE } from "../../config/notifierConstants";

const initialState = {};

const getChannelKey = channelData => {
  const id = channelData.channel_identifier;
  const tokenAddr = channelData.token_address;
  const key = `${id}-${tokenAddr}`;
  return key;
};

/**
 * This function is used to retrieve a channel temporary key
 * This only is used on channels pending to be opened
 */
const getTemporaryKey = channel => {
  const { token_address, partner_address } = channel;
  return `T-${partner_address}-${token_address}`;
};

const hasTemporaryChannel = (channel, state) => {
  const key = getTemporaryKey(channel);
  return !!state[key];
};

const removeTemporaryChannel = (channel, state) => {
  if (hasTemporaryChannel(channel, state)) {
    const key = getTemporaryKey(channel);
    const cleanedState = { ...state };
    delete cleanedState[key];
    return cleanedState;
  }
  return state;
};

const getPaymentChannelKey = data => {
  const { channelId, token } = data;
  return `${channelId}-${token}`;
};

const createChannel = (channel, hubAnswered = false) => ({
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

  if (openVotesQuantity >= neededVotes && canBeOpened) {
    channel.sdk_status = SDK_CHANNEL_STATUS.CHANNEL_OPENED;
    channel.canRemoveTemporalChannel = true;
  }
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
        let newState = { ...state };
        if (channelWithResponse.canRemoveTemporalChannel)
          newState = removeTemporaryChannel(channelWithResponse, state);

        return { ...newState, [nChannelKey]: channelWithResponse };
      }
      const newChannel = createChannel(action.channel, true);
      return { ...state, [nChannelKey]: newChannel };
    }

    // Notifiers vote for new channel
    case OPEN_CHANNEL_VOTE: {
      const { notifier, shouldOpen } = action;
      const chKey = getChannelKey(action.channel);
      let newState = { ...state };
      let ch = newState[chKey];
      // If the channel is not present, create it
      if (!ch) ch = createChannel(action.channel);

      // Add the corresponding vote, whether is positive or not
      ch = addVote(ch, { notifier, shouldOpen }, VOTE_TYPE.OPEN_CHANNEL_VOTE);

      const { numberOfNotifiers } = action;

      ch = checkIfChannelCanBeOpened(ch, numberOfNotifiers);

      if (ch.canRemoveTemporalChannel)
        newState = removeTemporaryChannel(ch, newState);

      return { ...newState, [chKey]: ch };
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
      newState[channelKey] = {
        ...newState[channelKey],
        sdk_status: CHANNEL_WAITING_FOR_CLOSE,
      };
      return newState;
    }

    case ADD_CHANNEL_WAITING_FOR_OPENING: {
      const { channel } = action;
      const key = getTemporaryKey(channel);
      const newState = { ...state };
      newState[key] = {
        ...channel,
        sdk_status: CHANNEL_WAITING_OPENING,
        isTemporary: true,
        isOpening: true,
      };
      return newState;
    }
    default:
      return state;
  }
};

export default channel;
