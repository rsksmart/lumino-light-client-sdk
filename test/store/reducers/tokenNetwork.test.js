import { ADD_NEW_TOKEN } from "../../../src/store/actions/types";
import reducer from "../../../src/store/reducers/tokensNetworkReducer";

const mockAddr = "0xFb783358Ff2b40630B112e3B937f0c43C1Ab2172";
const mockNetwork = "0x931A46774dFDC44aac1D6eCa15930b6c3895dD7a";

describe("Tokens network reducer", () => {
  it("should return initial state", () => {
    const red = reducer(undefined, {});
    expect(red).toEqual({});
  });

  it("Should handle ADD_NEW_TOKEN", () => {
    const action = {
      type: ADD_NEW_TOKEN,
      tokenNetwork: mockNetwork,
      tokenAddress: mockAddr,
    };
    const red = reducer(undefined, action);
    const expected = {
      [mockNetwork]: mockAddr,
    };
    expect(red).toEqual(expected);
  });
});
