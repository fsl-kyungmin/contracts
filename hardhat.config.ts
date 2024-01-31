
import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-etherscan"
import '@nomiclabs/hardhat-ethers'
import '@openzeppelin/hardhat-upgrades'
import '@typechain/hardhat'
import 'hardhat-contract-sizer'
import 'solidity-coverage'
import { HardhatUserConfig } from "hardhat/types";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
let config: HardhatUserConfig;


config = {
  networks: {
    hardhat: {},
    avalanche: {
      url: 'http://10.110.101.1:9650/ext/bc/C/rpc',
      accounts: {
        // https://hardhat.org/hardhat-network/docs/reference#accounts
        mnemonic: process.env.MNEMONIC ?? 'test test test test test test test test test test test junk',
        path: "m/44'/60'/0'/0", // https://support.avax.network/en/articles/7004986-what-derivation-paths-does-avalanche-use
        initialIndex: 0,
        count: 20,
        passphrase: ''
      },
      gas: 50000000
    }
  },

  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },

      outputSelection: {
        "*": {
          "*": [
            "storageLayout"
          ]
        }
      }
    }
  },

  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
  },

  mocha: {
    timeout: 600000
  },
};

module.exports = config
