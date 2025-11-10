import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import { HardhatUserConfig } from "hardhat/config";
import "dotenv/config";

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

// Hardhat configuration
const config: HardhatUserConfig = {
	defaultNetwork: "hardhat",

	networks: {
		hardhat: {
			chainId: 31337,
			allowUnlimitedContractSize: false,
			gas: "auto",
			gasPrice: "auto",
		},
		localhost: {
			url: "http://127.0.0.1:8545",
			chainId: 31337,
			accounts: [GANACHE_ACCOUNT_PRIVATE_KEY],
			timeout: 60000,
		},
		bscTestnet: {
			url: BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
			chainId: 97,
			accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
			gasPrice: 20000000000, // 20 gwei
			gas: "auto",
			timeout: 60000,
		},
		bscMainnet: {
			url: BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.binance.org",
			chainId: 56,
			accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
			gasPrice: 5000000000, // 5 gwei
			gas: "auto",
			timeout: 60000,
		},
		rskTestnet: {
			url: RSK_TESTNET_RPC_URL || "https://public-node.testnet.rsk.co",
			chainId: 31,
			accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
			gasPrice: 60000000, // 0.06 gwei
			gas: "auto",
			timeout: 60000,
		},
		rskMainnet: {
			url: RSK_MAINNET_RPC_URL || "https://public-node.rsk.co",
			chainId: 30,
			accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
			gasPrice: 60000000, // 0.06 gwei
			gas: "auto",
			timeout: 60000,
		},
	},

	solidity: {
		version: "0.8.24",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200, // Balance between deployment cost and runtime cost
			},
			viaIR: false, // Set to true for better optimization (slower compilation)
			metadata: {
				bytecodeHash: "none", // Remove metadata hash for deterministic bytecode
			},
			outputSelection: {
				"*": {
					"*": ["evm.bytecode", "evm.deployedBytecode", "abi"],
				},
			},
		},
	},

	etherscan: {
		apiKey: BSCSCAN_API_KEY || ETHERSCAN_API_KEY || "",
		customChains: [
			{
				network: "bscTestnet",
				chainId: 97,
				urls: {
					apiURL: "https://api-testnet.bscscan.com/api",
					browserURL: "https://testnet.bscscan.com",
				},
			},
			{
				network: "bsc",
				chainId: 56,
				urls: {
					apiURL: "https://api.bscscan.com/api",
					browserURL: "https://bscscan.com",
				},
			},
			{
				network: "rsktestnet",
				chainId: 31,
				urls: {
					apiURL: "https://rootstock-testnet.blockscout.com/api",
					browserURL: "https://rootstock-testnet.blockscout.com",
				},
			},
			{
				network: "rskmainnet",
				chainId: 30,
				urls: {
					apiURL: "https://rootstock.blockscout.com/api",
					browserURL: "https://rootstock.blockscout.com",
				},
			},
		],
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