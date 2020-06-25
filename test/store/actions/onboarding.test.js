import * as signatureResolver from "../../../src/utils/handlerResolver";
import callbacks, { CALLBACKS } from "../../../src/utils/callbacks";
import client from "../../../src/apiRest";

import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import * as onboardingFunctions from "../../../src/store/actions/onboarding";
import { MESSAGE_POLLING_START } from "../../../src/store/actions/types";

// Mock store
const lh = {
  storage: { saveLuminoData: jest.fn() },
};

const address = "0x920984391853d81CCeeC41AdB48a45D40594A0ec";
const middlewares = [thunk.withExtraArgument(lh)];
const mockStore = configureMockStore(middlewares);

describe("test onboarding behaviour", () => {
  const spyResolver = jest.spyOn(signatureResolver, "default");
  const spyCallbacks = jest.spyOn(callbacks, "trigger");

  afterEach(() => {
    spyResolver.mockReset();
    spyCallbacks.mockReset();
  });

  test("should perform onboarding successfully", async () => {
    const state = {
      client: {
        address,
      },
    };

    const store = mockStore(state);
    client.get.mockResolvedValue({
      data: {
        display_name_to_sign: "name",
        seed_retry: "seed_retry",
        password_to_sign: "password",
      },
    });
    spyResolver.mockResolvedValue("0x1234");
    const mockApiKey = "MockedApiKey";
    client.post.mockResolvedValue({ data: { api_key: mockApiKey } });

    await store.dispatch(onboardingFunctions.onboardingClient());
    const actions = store.getActions();


    expect(client.defaults.headers["x-api-key"]).toBe(mockApiKey);
    expect(actions.length).toBe(6);
    expect(actions[4]).toStrictEqual({ type: MESSAGE_POLLING_START });
  });

  test("should trigger failure on non successfull onboarding", async () => {
    const state = {
      client: {
        address,
      },
    };

    const store = mockStore(state);
    const mockError = new Error("Unexpected error");
    client.get.mockRejectedValue(mockError);

    await store.dispatch(onboardingFunctions.onboardingClient());

    expect(spyCallbacks).toHaveBeenCalledWith(
      CALLBACKS.CLIENT_ONBOARDING_FAILURE,
      address,
      mockError
    );
  });
});
