import {
  findMaxMsgInternalId,
  findMaxBlockId,
} from "../../src/utils/functions";
import { signatureRecover } from "../../src/utils/validators";

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

  test("should return a recovered signature", () => {
    const data = {
      type: "Delivered",
      delivered_message_identifier: "18237677588114994956",
      signature:
        "0x5c71e9c516d088d937a1c2a969293fa0631ab9c1a8c7ff2780223c5d2446e272513fd8f80ec4f51999c8294115b1d35e6fc60c3d9af15d2c85205979be17c63a1c",
    };
    const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";

    const recoveredAddress = signatureRecover(data);
    expect(recoveredAddress).toBeTruthy();
    expect(recoveredAddress).toBe(address);
  });

  test("should return a 0x for a 0x signature", () => {
    const data = {
      type: "Delivered",
      delivered_message_identifier: "18237677588114994956",
      signature: "0x",
    };

    const recoveredAddress = signatureRecover(data);
    expect(recoveredAddress).toBeTruthy();
    expect(recoveredAddress).toBe("0x");
  });

  test("should return a 0x for no signature", () => {
    const data = {
      type: "Delivered",
      delivered_message_identifier: "18237677588114994956",
    };

    const recoveredAddress = signatureRecover(data);
    expect(recoveredAddress).toBeTruthy();
    expect(recoveredAddress).toBe("0x");
  });
});
