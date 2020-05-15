
import { getState } from "./state";
import RNS from '@rsksmart/rns';
import Lumino from "../../Lumino";
import Web3 from "web3";


const rnsOptions = (chainId, registryAddress) =>{
    return {
        networkId: chainId,
        contractAddresses: {
          registry: registryAddress,
        },
    };
}
export const getRnsInstance = () =>{
    const {registryAddress} = getState().rnsReducer;
    const { rskEndpoint, chainId } = Lumino.getConfig();
    const web3 = new Web3(rskEndpoint);   
    const rns = new RNS(web3, rnsOptions(chainId, registryAddress));
    return rns;
}
