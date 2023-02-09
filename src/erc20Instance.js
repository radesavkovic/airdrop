import { ethers } from 'ethers'

import { erc20ABI } from './abis/erc20';

export const erc20Instance =  (address, signer) => {
    return new ethers.Contract(address, erc20ABI, signer);
}