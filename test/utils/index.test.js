import {
  findMaxMsgInternalId,
  findMaxBlockId,
} from "../../src/utils/functions";

describe("Test internal utils", () => {
  test("should find the biggest internal_msg_identifier", () => {
    const messages = [
      { internal_msg_identifier: 6 },
      { internal_msg_identifier: 2 },
      { internal_msg_identifier: 25 },
      { internal_msg_identifier: 3 },
    ];
    const maxInternalMsgId = findMaxMsgInternalId(messages);
    expect(maxInternalMsgId).toBe(25);
  });

  test("should find the biggest id for notifier block number", () => {
    const messages = [{ id: 6 }, { id: 2 }, { id: 21 }, { id: 3 }];
    const maxId = findMaxBlockId(messages);
    expect(maxId).toBe(21);
  });
});
