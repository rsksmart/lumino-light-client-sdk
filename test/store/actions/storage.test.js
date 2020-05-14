import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import { saveLuminoData } from "../../../src/store/actions/storage";

// Mock store
const lh = {
  storage: { saveLuminoData: jest.fn() },
};

const middlewares = [thunk.withExtraArgument(lh)];
const mockStore = configureMockStore(middlewares);

describe("test storage actions", () => {
  test("should save Lumino data", async () => {
    const state = {
      client: { address: 123 },
    };
    const store = mockStore(state);

    store.dispatch(saveLuminoData());
    expect(lh.storage.saveLuminoData).toHaveBeenCalledWith(state);
  });
});
