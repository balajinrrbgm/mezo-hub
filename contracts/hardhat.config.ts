import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import * as dotenv from 'dotenv'
dotenv.config()

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || '0x' + '0'.repeat(64)

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'london',
    },
  },
  networks: {
    hardhat: {},
    matsnet: {
      url: 'https://rpc.test.mezo.org',
      chainId: 31611,
      accounts: [DEPLOYER_KEY],
    },
  },
  etherscan: {
    apiKey: {
      matsnet: 'no-api-key-required',
    },
    customChains: [
      {
        network: 'matsnet',
        chainId: 31611,
        urls: {
          apiURL: 'https://explorer.test.mezo.org/api',
          browserURL: 'https://explorer.test.mezo.org',
        },
      },
    ],
  },
}

export default config
