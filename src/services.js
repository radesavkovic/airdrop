import blocknativeLogo from './icons/blocknative-logo'
import blocknativeIcon from './icons/blocknative-icon'

import { init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import ledgerModule from '@web3-onboard/ledger'
import walletConnectModule from '@web3-onboard/walletconnect'
import walletLinkModule from '@web3-onboard/walletlink'
import portisModule from '@web3-onboard/portis'
import fortmaticModule from '@web3-onboard/fortmatic'
import torusModule from '@web3-onboard/torus'
import keepkeyModule from '@web3-onboard/keepkey'
import gnosisModule from '@web3-onboard/gnosis'

// Replace with your DApp's Infura ID
const INFURA_ID = '9aa3d95b3bc440fa88ea12eaa4456161'

const injected = injectedModule()
const walletLink = walletLinkModule()
const walletConnect = walletConnectModule()

const portis = portisModule({
  apiKey: 'b2b7586f-2b1e-4c30-a7fb-c2d1533b153b'
})

const fortmatic = fortmaticModule({
  apiKey: 'pk_test_886ADCAB855632AA'
})

const torus = torusModule()
const ledger = ledgerModule()
const keepkey = keepkeyModule()

const gnosis = gnosisModule()


export const initWeb3Onboard = init({
  wallets: [
    injected,
    ledger,
    walletLink,
    walletConnect,
    gnosis,
    fortmatic,
    keepkey,
    portis,
    torus
  ],
  chains: [
    {
      id: '0x1',
      token: 'ETH',
      label: 'Ethereum Mainnet',
      rpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`
    }
  ],
  appMetadata: {
    name: 'Uniswap Interface',
    icon: blocknativeIcon,
    logo: blocknativeLogo,
    description: 'Dapp for Uniswap Airdrop',
    recommendedInjectedWallets: [
      { name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
      { name: 'MetaMask', url: 'https://metamask.io' }
    ]
  }
})