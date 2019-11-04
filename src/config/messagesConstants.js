export const MessageType = {
  DELIVERED: "Delivered",
  PROCESSED: "Processed",
  SECRET_REQUEST: "SecretRequest",
  SECRET_REVEAL: "SecretReveal",
  LOCKED_TRANSFER: "LockedTransfer",
  SECRET: "Secret",
};

export const MessageIdentifierKey = {
  [MessageType.DELIVERED]: "delivered_message_identifier",
  [MessageType.PROCESSED]: "message_identifier",
};

export const MessageNumPad = {
  [MessageType.DELIVERED]: 12,
  [MessageType.PROCESSED]: 0,
  [MessageType.SECRET_REQUEST]: 3,
  [MessageType.SECRET_REVEAL]: 11,
  [MessageType.LOCKED_TRANSFER]: 7,
};

export const MessageTypeID = {
  BALANCE_PROOF: 1,
};
