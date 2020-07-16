export const MessageType = {
  DELIVERED: "Delivered",
  PROCESSED: "Processed",
  SECRET_REVEAL: "SecretReveal",
  SECRET_REQUEST: "SecretRequest",
  REVEAL_SECRET: "RevealSecret",
  LOCKED_TRANSFER: "LockedTransfer",
  SECRET: "Secret",
  BALANCE_PROOF: "BalanceProof",
  LOCK_EXPIRED: "LockExpired",
};

export const PAYMENT_SUCCESSFUL = "PaymentSuccessful";
export const PAYMENT_EXPIRED = "PaymentExpired";
export const LC_PROTOCOL_MESSAGE_TYPE = "LightClientProtocolMessageType";

export const LIGHT_MESSAGE_TYPE = {
  PAYMENT_OK_FLOW: `${LC_PROTOCOL_MESSAGE_TYPE}.${PAYMENT_SUCCESSFUL}`,
  PAYMENT_EXPIRED: `${LC_PROTOCOL_MESSAGE_TYPE}.${PAYMENT_EXPIRED}`,
};

export const MessageIdentifierKey = {
  [MessageType.LOCKED_TRANSFER]: "message_identifier",
  [MessageType.DELIVERED]: "delivered_message_identifier",
  [MessageType.PROCESSED]: "message_identifier",
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
  14: "delivered_message_identifier",
};

export const MessageNumPad = {
  [MessageType.PROCESSED]: 0,
  UPDATE_BALANCE_PROOF: 4,
  [MessageType.SECRET_REQUEST]: 3,
  [MessageType.BALANCE_PROOF]: 4,
  [MessageType.LOCKED_TRANSFER]: 7,
  [MessageType.REVEAL_SECRET]: 11,
  [MessageType.DELIVERED]: 12,
  [MessageType.LOCK_EXPIRED]: 13,
};

export const MessageTypeID = {
  BALANCE_PROOF: 1,
};
