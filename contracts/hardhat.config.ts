import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin";
import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "4457c4ce0594464582fc7c8dfbc5d395";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
      metadata: {
        bytecodeHash: "none",
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // Zama Ethereum (if needed in future)
    zama: {
      url: "https://ethnode1.zama.fhe.io",
      chainId: 8009,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      chainId: 11155111,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
