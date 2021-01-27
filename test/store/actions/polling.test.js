import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import {
  stopHubPolling,
  stopNotifierPolling,
} from "../../../src/store/actions/polling";
import {
  MESSAGE_POLLING_STOP,
  STOP_NOTIFICATIONS_POLLING,
} from "../../../src/store/actions/types";
import { chkSum } from "../../../src/utils/functions";

const address = chkSum("0x920984391853d81CCeeC41AdB48a45D40594A0ec");
// Mock store
const lh = {
  storage: { saveLuminoData: jest.fn() },
};
const middlewares = [thunk.withExtraArgument(lh)];
const mockStore = configureMockStore(middlewares);

describe("test payment actions", () => {
  const state = {
    client: {
      address,
    },
    notifier: {
      notifiers: {},
    },
    channelReducer: {},
  };

  it("dispatches a stop hub polling", () => {
    const store = mockStore(state);
    const action = { type: MESSAGE_POLLING_STOP };
    store.dispatch(stopHubPolling());
    const actions = store.getActions();
    expect(actions.length).toBe(1);
    expect(actions[0]).toStrictEqual(action);
  });

  it("dispatches a notification stop polling", () => {
    const store = mockStore(state);
    const action = { type: STOP_NOTIFICATIONS_POLLING };
    store.dispatch(stopNotifierPolling());
    const actions = store.getActions();
    expect(actions.length).toBe(1);
    expect(actions[0]).toStrictEqual(action);
  });
});
