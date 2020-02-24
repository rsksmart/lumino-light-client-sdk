jest.mock("../../../src/store/functions/state.js", () => {
  ({ getState: jest.fn() });
});
