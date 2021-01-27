import Store from "../../src/store";

describe("Testing advanced store initialization", () => {
  test("Can initialize store without a storage implementation", async () => {
    await Store.initStore(null, {});
    expect(Store.getStore()).toBeTruthy();
  });
});
