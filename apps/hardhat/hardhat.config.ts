import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import { HardhatUserConfig } from "hardhat/config";
import "dotenv/config";
import fs from "fs";
import path from "path";
import {Wallet} from "ethers";







// Environment variable setup with fallbacks
const RSK_MAINNET_RPC_URL = process.env.RSK_MAINNET_RPC_URL || "";
const RSK_TESTNET_RPC_URL = process.env.RSK_TESTNET_RPC_URL || "";
const BSC_TESTNET_RPC_URL = process.env.BSC_TESTNET_RPC_URL || "";
const BSC_MAINNET_RPC_URL = process.env.BSC_MAINNET_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Ganache test account (only for local development)
const GANACHE_ACCOUNT_PRIVATE_KEY = "0x8a2ad2e6cac368f838fe2dcbd45e076bf96d9c938a2bd708d7ae662a33b6ea53";

// Development mode check (skip validation for local/hardhat networks)
const isDevelopment = process.env.NODE_ENV === "development" ||
	process.argv.includes("test") ||
	process.argv.includes("coverage") ||
	process.argv.includes("compile") ||
	process.argv.includes("--network hardhat") ||
	process.argv.includes("--network localhost");

// Validate environment variables only when deploying to real networks
if (!isDevelopment) {
	const networkArg = process.argv.find(arg => arg.startsWith("--network"));
	const isRealNetwork = networkArg && !networkArg.includes("hardhat") && !networkArg.includes("localhost");

	if (isRealNetwork) {
		if (!ETHERSCAN_API_KEY) {
			console.warn("⚠️  Warning: ETHERSCAN_API_KEY is not configured. Contract verification will fail.");
		}

		if (!PRIVATE_KEY) {
			throw new Error("❌ PRIVATE_KEY is not configured. Please add it to your .env file.");
		}

		if (networkArg.includes("rsk") && (!RSK_MAINNET_RPC_URL && !RSK_TESTNET_RPC_URL)) {
			throw new Error("❌ RSK RPC URLs are not configured. Please add them to your .env file.");
		}
	}
}



function loadWalletFromKeystore() {
    const keystorePath = path.join(__dirname, "keystore");
    const files = fs.readdirSync(keystorePath).filter(f => f.endsWith(".json"));
    if (files.length === 0) throw new Error("No keystore file found in keystore/");
    const json = fs.readFileSync(path.join(keystorePath, files[0]), "utf8");
    const password = process.env.KEY_PASSWORD;
    if (!password) throw new Error("Set KEY_PASSWORD in .env");
    const wallet = Wallet.fromEncryptedJsonSync(json, password);
    return wallet;
}

const wallet = loadWalletFromKeystore();

// Hardhat configuration
const config: HardhatUserConfig = {
	 solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 800, // Increased from 200 - optimizes for runtime gas efficiency
            },
            
            viaIR: true,
        },
    },
	defaultNetwork: "hardhat",

	   networks: {
        hardhat: {
            chainId: 31337,
            gas: "auto",
            gasPrice: "auto",
            accounts: {
                mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
                count: 20,
            },
            forking: {
                url: process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.binance.org/",
                enabled: process.env.FORK === "true",
                blockNumber: process.env.FORK_BLOCK_NUMBER ? Number(process.env.FORK_BLOCK_NUMBER) : undefined,
            },
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
        },
        polygonAmoy: {
            url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
            accounts: wallet.privateKey ? [wallet.privateKey] : [],
            chainId: 80002,
            gasPrice: 35000000000, // 35 gwei
            gas: 6000000,
        },
        polygon: {
            url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
            accounts: wallet.privateKey ? [wallet.privateKey] : [],
            chainId: 137,
            gasPrice: 200000000000, // 200 gwei (adjust based on network conditions)
            gas: 6000000,
        },
        bscTestnet: {
            url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
            accounts: wallet.privateKey ? [wallet.privateKey] : [],
            chainId: 97,
            gasPrice: 10000000000, // 10 gwei
            gas: 6000000,
        },
        bsc: {
            url: process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.binance.org/",
            accounts: wallet.privateKey ? [wallet.privateKey] : [],
            chainId: 56,
            gasPrice: 5000000000, // 5 gwei
            gas: 6000000,
        },
    },
    etherscan: {
        apiKey: process.env.BSCSCAN_API_KEY || "",
        customChains: [
            {
                network: "polygonAmoy",
                chainId: 80002,
                urls: {
                    apiURL: "https://api-amoy.polygonscan.com/api",
                    browserURL: "https://amoy.polygonscan.com"
                }
            },
            {
                network: "bscTestnet",
                chainId: 97,
                urls: {
                    apiURL: "https://api-testnet.bscscan.com/api",
                    browserURL: "https://testnet.bscscan.com"
                }
            },
            {
                network: "bsc",
                chainId: 56,
                urls: {
                    apiURL: "https://api.bscscan.com/api",
                    browserURL: "https://bscscan.com"
                }
            }
        ]
    },
	paths: {
		sources: "./contracts",
		tests: "./test",
		cache: "./cache",
		artifacts: "./artifacts",
	},

	typechain: {
		outDir: "typechain-types",
		target: "ethers-v6",
	},

	mocha: {
		timeout: 120000,
	},
};

export default config;