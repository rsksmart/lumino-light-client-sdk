import callbacks, { CALLBACKS } from "../../src/utils/callbacks";

describe("Callback tests", () => {
  test("Can set a Callback of 1 parameter and trigger it", () => {
    const stubFn = jest.fn();
    callbacks.set(CALLBACKS.OPEN_CHANNEL, stubFn);
    callbacks.trigger(CALLBACKS.OPEN_CHANNEL, "123");
    expect(stubFn).toBeCalledWith("123");
  });

  test("Can set a Callback of 2 parameters and trigger it", () => {
    const stubFn = jest.fn();
    callbacks.set(CALLBACKS.FAILED_OPEN_CHANNEL, stubFn);
    const error = new Error("Failure");
    callbacks.trigger(CALLBACKS.FAILED_OPEN_CHANNEL, "123", error);
    expect(stubFn).toBeCalledWith("123", error);
  });

  test("Will return an anonymous function if callback is not set", () => {
    const returned = callbacks.trigger(CALLBACKS.CLOSE_CHANNEL, "123");
    expect(returned).toBeInstanceOf(Function);
  });
});
