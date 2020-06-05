import { LocalStorageHandler } from "../../src";

test("should save lumino data", () => {
  const fakeData = {
    1: "I am a fake",
  };
  LocalStorageHandler.saveLuminoData(fakeData);

  const retrievedData = LocalStorageHandler.getLuminoData();
  expect(retrievedData).toStrictEqual(fakeData);
});
