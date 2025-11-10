import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
    network: string;
    chainId: number;
    deployer: string;
    factoryOwner: string;
    timestamp: string;
    contracts: {
        CrowdFundingToken: {
            address: string;
            transactionHash: string;
            blockNumber: number;
            verified: boolean;
        };
        CrowdFunding: {
            address: string;
            transactionHash: string;
            blockNumber: number;
            verified: boolean;
        };
        CrowdFundingFactory: {
            address: string;
            transactionHash: string;
            blockNumber: number;
            verified: boolean;
            owner: string;
            constructorArgs: {
                implementation: string;
                donationTokenAddress: string;
            };
        };
    };
}

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyContract(
    address: string,
    constructorArguments: any[] = []
): Promise<boolean> {
    console.log(`\nVerifying contract at ${address}...`);

    // Skip verification for localhost/hardhat networks
    if (network.name === "hardhat" || network.name === "localhost") {
        console.log("Skipping verification on local network");
        return false;
    }

    try {
        // Wait a bit for the contract to be indexed by the block explorer
        console.log("Waiting for block explorer to index the contract...");
        await sleep(30000); // 30 seconds

        await run("verify:verify", {
            address: address,
            constructorArguments: constructorArguments,
        });

        console.log(`✅ Contract verified successfully!`);
        return true;
    } catch (error: any) {
        if (error.message.includes("Already Verified")) {
            console.log("✅ Contract already verified!");
            return true;
        }
        console.error(`❌ Verification failed: ${error.message}`);
        return false;
    }
}

function saveDeploymentInfo(deploymentInfo: DeploymentInfo): void {
    const deploymentsDir = path.join(__dirname, "..", "deployments");

    // Ensure deployments directory exists
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save network-specific deployment file
    const networkFile = path.join(deploymentsDir, `${deploymentInfo.network}.json`);
    fs.writeFileSync(networkFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📄 Deployment info saved to: ${networkFile}`);

    // Also save to latest.json for easy access
    const latestFile = path.join(deploymentsDir, "latest.json");
    fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📄 Latest deployment saved to: ${latestFile}`);
}

async function main() {
    console.log("🚀 Starting deployment process...\n");

    // ============================================
    // PRE-DEPLOYMENT CHECKS
    // ============================================

    // Check for FACTORY_CONTRACT_OWNER environment variable
    const factoryOwner = process.env.FACTORY_CONTRACT_OWNER;

    if (!factoryOwner) {
        console.error("❌ FACTORY_CONTRACT_OWNER environment variable is not set!");
        console.error("\nPlease add FACTORY_CONTRACT_OWNER to your .env file:");
        console.error("FACTORY_CONTRACT_OWNER=0xYourOwnerAddress\n");
        process.exit(1);
    }

    // Validate the address format
    if (!ethers.isAddress(factoryOwner)) {
        console.error("❌ FACTORY_CONTRACT_OWNER is not a valid Ethereum address!");
        console.error(`   Provided: ${factoryOwner}\n`);
        process.exit(1);
    }

    console.log(`✅ Factory will be transferred to: ${factoryOwner}\n`);

    // Get network info
    const networkName = network.name;
    const chainId = (await ethers.provider.getNetwork()).chainId;

    console.log(`Network: ${networkName}`);
    console.log(`Chain ID: ${chainId}`);

    // Get deployer
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const balance = await ethers.provider.getBalance(deployerAddress);

    console.log(`\nDeployer: ${deployerAddress}`);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

    if (balance === 0n) {
        throw new Error("Deployer account has no funds!");
    }

    // Initialize deployment info
    const deploymentInfo: DeploymentInfo = {
        network: networkName,
        chainId: Number(chainId),
        deployer: deployerAddress,
        factoryOwner: factoryOwner,
        timestamp: new Date().toISOString(),
        contracts: {
            CrowdFundingToken: {
                address: "",
                transactionHash: "",
                blockNumber: 0,
                verified: false,
            },
            CrowdFunding: {
                address: "",
                transactionHash: "",
                blockNumber: 0,
                verified: false,
            },
            CrowdFundingFactory: {
                address: "",
                transactionHash: "",
                blockNumber: 0,
                verified: false,
                owner: factoryOwner,
                constructorArgs: {
                    implementation: "",
                    donationTokenAddress: "",
                },
            },
        },
    };

    // ============================================
    // STEP 1: Deploy CrowdFundingToken
    // ============================================
    console.log("📦 Step 1/3: Deploying CrowdFundingToken...");

    const CrowdFundingTokenFactory = await ethers.getContractFactory("CrowdFundingToken");
    const crowdFundingToken = await CrowdFundingTokenFactory.deploy();
    await crowdFundingToken.waitForDeployment();

    const tokenAddress = await crowdFundingToken.getAddress();
    const tokenDeployTx = crowdFundingToken.deploymentTransaction();

    console.log(`✅ CrowdFundingToken deployed to: ${tokenAddress}`);
    console.log(`   Transaction hash: ${tokenDeployTx?.hash}`);
    console.log(`   Block number: ${tokenDeployTx?.blockNumber}\n`);

    deploymentInfo.contracts.CrowdFundingToken.address = tokenAddress;
    deploymentInfo.contracts.CrowdFundingToken.transactionHash = tokenDeployTx?.hash || "";
    deploymentInfo.contracts.CrowdFundingToken.blockNumber = tokenDeployTx?.blockNumber || 0;

    // ============================================
    // STEP 2: Deploy CrowdFunding Implementation
    // ============================================
    console.log("📦 Step 2/3: Deploying CrowdFunding Implementation...");

    const CrowdFundingFactory = await ethers.getContractFactory("CrowdFunding");
    const crowdFundingImplementation = await CrowdFundingFactory.deploy();
    await crowdFundingImplementation.waitForDeployment();

    const implementationAddress = await crowdFundingImplementation.getAddress();
    const implementationDeployTx = crowdFundingImplementation.deploymentTransaction();

    console.log(`✅ CrowdFunding Implementation deployed to: ${implementationAddress}`);
    console.log(`   Transaction hash: ${implementationDeployTx?.hash}`);
    console.log(`   Block number: ${implementationDeployTx?.blockNumber}\n`);

    deploymentInfo.contracts.CrowdFunding.address = implementationAddress;
    deploymentInfo.contracts.CrowdFunding.transactionHash = implementationDeployTx?.hash || "";
    deploymentInfo.contracts.CrowdFunding.blockNumber = implementationDeployTx?.blockNumber || 0;

    // ============================================
    // STEP 3: Deploy CrowdFundingFactory
    // ============================================
    console.log("📦 Step 3/3: Deploying CrowdFundingFactory...");

    const FactoryContract = await ethers.getContractFactory("CrowdFundingFactory");
    const factory = await FactoryContract.deploy(implementationAddress, tokenAddress);
    await factory.waitForDeployment();

    const factoryAddress = await factory.getAddress();
    const factoryDeployTx = factory.deploymentTransaction();

    console.log(`✅ CrowdFundingFactory deployed to: ${factoryAddress}`);
    console.log(`   Transaction hash: ${factoryDeployTx?.hash}`);
    console.log(`   Block number: ${factoryDeployTx?.blockNumber}\n`);

    deploymentInfo.contracts.CrowdFundingFactory.address = factoryAddress;
    deploymentInfo.contracts.CrowdFundingFactory.transactionHash = factoryDeployTx?.hash || "";
    deploymentInfo.contracts.CrowdFundingFactory.blockNumber = factoryDeployTx?.blockNumber || 0;
    deploymentInfo.contracts.CrowdFundingFactory.constructorArgs = {
        implementation: implementationAddress,
        donationTokenAddress: tokenAddress,
    };

    // ============================================
    // STEP 4: Setup Token with Factory
    // ============================================
    console.log("⚙️  Setting up CrowdFundingToken with Factory...");

    const setupTx = await crowdFundingToken.setFactoryAndTransferOwnership(factoryAddress);
    await setupTx.wait();

    console.log(`✅ Token ownership transferred to Factory`);
    console.log(`   Transaction hash: ${setupTx.hash}\n`);

    // ============================================
    // STEP 5: Transfer Factory Ownership
    // ============================================
    console.log("👑 Transferring Factory ownership...");
    console.log(`   Current owner: ${deployerAddress}`);
    console.log(`   New owner: ${factoryOwner}\n`);

    const transferTx = await factory.transferOwnership(factoryOwner);
    await transferTx.wait();

    // Verify ownership transfer
    const currentOwner = await factory.owner();
    if (currentOwner.toLowerCase() === factoryOwner.toLowerCase()) {
        console.log(`✅ Factory ownership successfully transferred!`);
        console.log(`   Transaction hash: ${transferTx.hash}`);
        console.log(`   New owner: ${currentOwner}\n`);
    } else {
        console.error(`❌ Ownership transfer failed!`);
        console.error(`   Expected owner: ${factoryOwner}`);
        console.error(`   Current owner: ${currentOwner}\n`);
        throw new Error("Ownership transfer verification failed");
    }

    // ============================================
    // STEP 6: Verify Contracts
    // ============================================
    console.log("🔍 Starting contract verification...\n");

    // Verify CrowdFundingToken (no constructor args)
    deploymentInfo.contracts.CrowdFundingToken.verified = await verifyContract(
        tokenAddress,
        []
    );

    // Verify CrowdFunding Implementation (no constructor args)
    deploymentInfo.contracts.CrowdFunding.verified = await verifyContract(
        implementationAddress,
        []
    );

    // Verify CrowdFundingFactory (with constructor args)
    deploymentInfo.contracts.CrowdFundingFactory.verified = await verifyContract(
        factoryAddress,
        [implementationAddress, tokenAddress]
    );

    // ============================================
    // STEP 7: Save Deployment Information
    // ============================================
    saveDeploymentInfo(deploymentInfo);

    // ============================================
    // DEPLOYMENT SUMMARY
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`\nNetwork: ${networkName} (Chain ID: ${chainId})`);
    console.log(`Deployer: ${deployerAddress}`);
    console.log(`Factory Owner: ${factoryOwner}`);
    console.log(`\nDeployed Contracts:`);
    console.log(`├─ CrowdFundingToken:    ${tokenAddress}`);
    console.log(`│  └─ Verified: ${deploymentInfo.contracts.CrowdFundingToken.verified ? "✅" : "❌"}`);
    console.log(`│  └─ Owner: Factory (${factoryAddress})`);
    console.log(`├─ CrowdFunding (Impl):  ${implementationAddress}`);
    console.log(`│  └─ Verified: ${deploymentInfo.contracts.CrowdFunding.verified ? "✅" : "❌"}`);
    console.log(`└─ CrowdFundingFactory:  ${factoryAddress}`);
    console.log(`   └─ Verified: ${deploymentInfo.contracts.CrowdFundingFactory.verified ? "✅" : "❌"}`);
    console.log(`   └─ Owner: ${factoryOwner}`);
    console.log("\n" + "=".repeat(60) + "\n");

    // Display next steps
    console.log("📋 Next Steps:");
    console.log("1. Update frontend/subgraph config with contract addresses");
    console.log("2. Fund the factory with initial gas if needed");
    console.log("3. Test creating a campaign through the factory\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
