import { ADD_NEW_TOKEN_NAME_SYMBOL } from "../../../src/store/actions/types";
import reducer from "../../../src/store/reducers/tokenNamesReducer";

const mockAddr = "0xFb783358Ff2b40630B112e3B937f0c43C1Ab2172";

describe("Token names reducer", () => {
  it("should return initial state", () => {
    const red = reducer(undefined, {});
    expect(red).toEqual({});
  });

  it("Should handle ADD_NEW_TOKEN_NAME_SYMBOL", () => {
    const action = {
      type: ADD_NEW_TOKEN_NAME_SYMBOL,
      token_name: "RIF",
      token_symbol: "tRIF",
      token_address: mockAddr,
    };
    const red = reducer(undefined, action);
    const expected = {
      [mockAddr]: {
        token_name: "RIF",
        token_symbol: "tRIF",
      },
    };
    expect(red).toEqual(expected);
  });
});
