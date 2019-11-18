export const MessageType = {
  DELIVERED: "Delivered",
  PROCESSED: "Processed",
  SECRET_REVEAL: "SecretReveal",
  SECRET_REQUEST: "SecretRequest",
  REVEAL_SECRET: "RevealSecret",
  LOCKED_TRANSFER: "LockedTransfer",
  SECRET: "Secret",
  BALANCE_PROOF: "BalanceProof"
};

export const MessageIdentifierKey = {
  [MessageType.LOCKED_TRANSFER]: "message_identifier",
  [MessageType.DELIVERED]: "delivered_message_identifier",
  [MessageType.PROCESSED]: "message_identifier"
};

export const MessageKeyForOrder = {
  0: "message",
  1: "message_identifier",
  2: "delivered_message_identifier",
  3: "message_identifier",
  4: "delivered_message_identifier",
  5: "message_identifier",
  6: "delivered_message_identifier",
  7: "message_identifier",
  8: "delivered_message_identifier",
  9: "message_identifier",
  10: "delivered_message_identifier",
  11: "message_identifier",
  12: "delivered_message_identifier",
  13: "message_identifier",
  14: "delivered_message_identifier"
};

export const MessageNumPad = {
  [MessageType.DELIVERED]: 12,
  [MessageType.BALANCE_PROOF]: 4,
  [MessageType.PROCESSED]: 0,
  [MessageType.SECRET_REQUEST]: 3,
  [MessageType.REVEAL_SECRET]: 11,
  [MessageType.LOCKED_TRANSFER]: 7
};

export const MessageTypeID = {
  BALANCE_PROOF: 1
};
