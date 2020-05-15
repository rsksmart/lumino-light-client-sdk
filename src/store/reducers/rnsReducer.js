import {
    SET_REGISTRY_ADDRESS
  } from "../actions/types";
  
const initialState = {
    registryAddress: ""
};
  
const rnsReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_REGISTRY_ADDRESS: {
            const newRegistryAddress = { ...state, registryAddress: action.registryAddress };
            return newRegistryAddress;
        }
        default:
            return state;
    };
};
  
export default rnsReducer;
  