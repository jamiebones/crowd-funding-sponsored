const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
require("dotenv").config();

/**
 * Helper function to get network native currency symbol
 */
function getNetworkCurrency(networkName) {
    const currencyMap = {
        'bsc': 'BNB',
        'bscTestnet': 'BNB',
        'polygon': 'MATIC',
        'polygonAmoy': 'MATIC',
        'ethereum': 'ETH',
        'hardhat': 'ETH',
        'localhost': 'ETH'
    };
    return currencyMap[networkName] || 'ETH';
}

/**
 * Helper function to wait for transaction confirmations
 * Optimized: BSC only needs 1 confirmation for safety
 */
async function waitForConfirmations(tx, confirmations = 1) {
    console.log(`  Waiting for ${confirmations} confirmation(s)...`);
    const receipt = await tx.wait(confirmations);
    console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
    return receipt;
}

/**
 * Helper function to validate contract deployment
 */
async function validateDeployment(contract, contractName) {
    const address = await contract.getAddress();
    const code = await ethers.provider.getCode(address);

    if (code === '0x') {
        throw new Error(`${contractName} deployment failed - no code at address ${address}`);
    }

    console.log(`  ✅ ${contractName} deployed successfully`);
    return address;
}

async function main() {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   CrowdFunding Platform Deployment Script             ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    // Get network info
    const networkName = hre.network.name;
    const networkCurrency = getNetworkCurrency(networkName);

    console.log(`Network: ${networkName}`);
    console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ${networkCurrency}\n`);

    if (balance === 0n) {
        throw new Error("❌ Deployer account has no funds!");
    }

    // ============================================
    // PRE-DEPLOYMENT CONFIGURATION
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Pre-Deployment Configuration                         ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    // Check for FACTORY_CONTRACT_OWNER environment variable
    const factoryOwner = process.env.FACTORY_CONTRACT_OWNER;

    if (!factoryOwner) {
        throw new Error("❌ FACTORY_CONTRACT_OWNER environment variable is not set!");
    }

    // Validate the address format
    if (!ethers.isAddress(factoryOwner)) {
        throw new Error(`❌ FACTORY_CONTRACT_OWNER is not a valid Ethereum address: ${factoryOwner}`);
    }

    console.log(`Factory Owner:  ${factoryOwner}`);
    console.log(`Deployer:       ${deployer.address}\n`);

    // ============================================
    // STEP 1: Deploy CrowdFundingToken
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Step 1: Deploy CrowdFundingToken                    ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    const CrowdFundingTokenFactory = await ethers.getContractFactory("CrowdFundingToken");
    console.log("  Deploying contract...");
    const crowdFundingToken = await CrowdFundingTokenFactory.deploy();
    await crowdFundingToken.waitForDeployment();
    const tokenAddress = await validateDeployment(crowdFundingToken, "CrowdFundingToken");
    const tokenDeployTx = crowdFundingToken.deploymentTransaction();
    console.log(`  Address: ${tokenAddress}`);
    console.log(`  Transaction: ${tokenDeployTx?.hash}`);
    console.log(`  Block: ${tokenDeployTx?.blockNumber}\n`);

    // ============================================
    // STEP 2: Deploy CrowdFunding Implementation
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Step 2: Deploy CrowdFunding Implementation          ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    const CrowdFundingFactory = await ethers.getContractFactory("CrowdFunding");
    console.log("  Deploying contract...");
    const crowdFundingImplementation = await CrowdFundingFactory.deploy();
    await crowdFundingImplementation.waitForDeployment();
    const implementationAddress = await validateDeployment(crowdFundingImplementation, "CrowdFunding");
    const implementationDeployTx = crowdFundingImplementation.deploymentTransaction();
    console.log(`  Address: ${implementationAddress}`);
    console.log(`  Transaction: ${implementationDeployTx?.hash}`);
    console.log(`  Block: ${implementationDeployTx?.blockNumber}\n`);

    // ============================================
    // STEP 3: Deploy CrowdFundingFactory
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Step 3: Deploy CrowdFundingFactory                  ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    const FactoryContract = await ethers.getContractFactory("CrowdFundingFactory");
    console.log("  Deploying contract...");
    console.log(`  Constructor args:`);
    console.log(`    - Implementation: ${implementationAddress}`);
    console.log(`    - Token:          ${tokenAddress}`);
    const factory = await FactoryContract.deploy(implementationAddress, tokenAddress);
    await factory.waitForDeployment();
    const factoryAddress = await validateDeployment(factory, "CrowdFundingFactory");
    const factoryDeployTx = factory.deploymentTransaction();
    console.log(`  Address: ${factoryAddress}`);
    console.log(`  Transaction: ${factoryDeployTx?.hash}`);
    console.log(`  Block: ${factoryDeployTx?.blockNumber}\n`);

    // ============================================
    // STEP 4: Setup Token with Factory
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Step 4: Setup CrowdFundingToken with Factory        ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    console.log("  Transferring token ownership to factory...");
    const setupTx = await crowdFundingToken.setFactoryAndTransferOwnership(factoryAddress);
    await waitForConfirmations(setupTx);
    console.log(`  ✅ Token ownership transferred to Factory\n`);

    // Verify token setup
    const tokenOwner = await crowdFundingToken.owner();
    if (tokenOwner.toLowerCase() !== factoryAddress.toLowerCase()) {
        throw new Error(`Token ownership verification failed! Expected: ${factoryAddress}, Got: ${tokenOwner}`);
    }
    console.log(`  ✅ Token ownership verified: ${tokenOwner}\n`);

    // ============================================
    // STEP 5: Transfer Factory Ownership
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Step 5: Transfer Factory Ownership                  ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    console.log(`  Current owner: ${deployer.address}`);
    console.log(`  New owner:     ${factoryOwner}`);
    console.log("  Transferring ownership...");
    const transferTx = await factory.transferOwnership(factoryOwner);
    await waitForConfirmations(transferTx);

    // Verify ownership transfer
    const currentOwner = await factory.owner();
    if (currentOwner.toLowerCase() !== factoryOwner.toLowerCase()) {
        throw new Error(`Ownership transfer failed! Expected: ${factoryOwner}, Got: ${currentOwner}`);
    }
    console.log(`  ✅ Factory ownership successfully transferred!`);
    console.log(`  New owner: ${currentOwner}\n`);

    // ============================================
    // STEP 6: Verify Deployment State
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Step 6: Verify Deployment State                     ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    console.log("Contract Addresses:");
    console.log(`  CrowdFundingToken:    ${tokenAddress}`);
    console.log(`    └─ Owner:           ${tokenOwner}`);
    console.log(`  CrowdFunding (Impl):  ${implementationAddress}`);
    console.log(`  CrowdFundingFactory:  ${factoryAddress}`);
    console.log(`    └─ Owner:           ${currentOwner}`);

    // Get factory details
    const factoryToken = await factory.donationToken();

    console.log("\nFactory Configuration:");
    console.log(`  Implementation:       ${implementationAddress}`);
    console.log(`  Donation Token:       ${factoryToken}`);

    // Validate configuration
    if (factoryToken.toLowerCase() !== tokenAddress.toLowerCase()) {
        throw new Error("Factory token mismatch!");
    }

    console.log(`\n✅ All validations passed!\n`);

    // ============================================
    // STEP 7: Save Deployment Information
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Step 7: Save Deployment Information                 ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    const deploymentInfo = {
        network: networkName,
        chainId: Number((await ethers.provider.getNetwork()).chainId),
        deployer: deployer.address,
        factoryOwner: factoryOwner,
        timestamp: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        contracts: {
            CrowdFundingToken: {
                address: tokenAddress,
                transactionHash: tokenDeployTx?.hash || "",
                blockNumber: tokenDeployTx?.blockNumber || 0,
                owner: tokenOwner,
                verified: false
            },
            CrowdFunding: {
                address: implementationAddress,
                transactionHash: implementationDeployTx?.hash || "",
                blockNumber: implementationDeployTx?.blockNumber || 0,
                verified: false
            },
            CrowdFundingFactory: {
                address: factoryAddress,
                transactionHash: factoryDeployTx?.hash || "",
                blockNumber: factoryDeployTx?.blockNumber || 0,
                owner: currentOwner,
                verified: false,
                constructorArgs: {
                    implementation: implementationAddress,
                    donationTokenAddress: tokenAddress
                }
            }
        },
        transactions: {
            tokenDeployment: tokenDeployTx?.hash,
            implementationDeployment: implementationDeployTx?.hash,
            factoryDeployment: factoryDeployTx?.hash,
            tokenOwnershipTransfer: setupTx.hash,
            factoryOwnershipTransfer: transferTx.hash
        }
    };

    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`  ✅ Deployment info saved to: ${deploymentFile}`);

    // Also save to latest.json for easy access
    const latestFile = path.join(deploymentsDir, "latest.json");
    fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`  ✅ Latest deployment saved to: ${latestFile}\n`);

    // ============================================
    // STEP 8: Verify Contracts on Block Explorer
    // ============================================
    if (networkName !== "localhost" && networkName !== "hardhat") {
        console.log("╔════════════════════════════════════════════════════════╗");
        console.log("║   Step 8: Verify Contracts on Block Explorer          ║");
        console.log("╚════════════════════════════════════════════════════════╝");

        console.log("  Waiting 30 seconds for blockchain indexing...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        const explorerName = networkName.includes('bsc') ? 'BscScan' : 
                            networkName.includes('polygon') ? 'PolygonScan' : 'Etherscan';

        // Verify CrowdFundingToken (no constructor args)
        try {
            console.log(`  Verifying CrowdFundingToken on ${explorerName}...`);
            await hre.run("verify:verify", {
                address: tokenAddress,
                constructorArguments: [],
                contract: "contracts/CrowdFundingToken.sol:CrowdFundingToken"
            });
            console.log(`  ✅ CrowdFundingToken verified`);
            deploymentInfo.contracts.CrowdFundingToken.verified = true;
        } catch (error) {
            if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
                console.log(`  ✅ CrowdFundingToken already verified`);
                deploymentInfo.contracts.CrowdFundingToken.verified = true;
            } else {
                console.log(`  ⚠️  CrowdFundingToken verification failed: ${error.message}`);
            }
        }

        // Verify CrowdFunding Implementation (no constructor args)
        try {
            console.log(`  Verifying CrowdFunding Implementation on ${explorerName}...`);
            await hre.run("verify:verify", {
                address: implementationAddress,
                constructorArguments: [],
                contract: "contracts/CrowdFunding.sol:CrowdFunding"
            });
            console.log(`  ✅ CrowdFunding Implementation verified`);
            deploymentInfo.contracts.CrowdFunding.verified = true;
        } catch (error) {
            if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
                console.log(`  ✅ CrowdFunding Implementation already verified`);
                deploymentInfo.contracts.CrowdFunding.verified = true;
            } else {
                console.log(`  ⚠️  CrowdFunding verification failed: ${error.message}`);
            }
        }

        // Verify CrowdFundingFactory (with constructor args)
        try {
            console.log(`  Verifying CrowdFundingFactory on ${explorerName}...`);
            console.log(`    Constructor args: [${implementationAddress}, ${tokenAddress}]`);
            await hre.run("verify:verify", {
                address: factoryAddress,
                constructorArguments: [implementationAddress, tokenAddress],
                contract: "contracts/CrowdFundingFactory.sol:CrowdFundingFactory"
            });
            console.log(`  ✅ CrowdFundingFactory verified`);
            deploymentInfo.contracts.CrowdFundingFactory.verified = true;
        } catch (error) {
            if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
                console.log(`  ✅ CrowdFundingFactory already verified`);
                deploymentInfo.contracts.CrowdFundingFactory.verified = true;
            } else {
                console.log(`  ⚠️  CrowdFundingFactory verification failed: ${error.message}`);
            }
        }

        // Update deployment file with verification status
        deploymentInfo.verificationTimestamp = new Date().toISOString();
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
        console.log(`  ✅ Verification status updated in deployment files\n`);
    }

    // ============================================
    // DEPLOYMENT SUMMARY
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   DEPLOYMENT SUCCESSFUL! 🚀                            ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    console.log("📋 Contract Addresses:");
    console.log(`  CrowdFundingToken:    ${tokenAddress}`);
    console.log(`  CrowdFunding (Impl):  ${implementationAddress}`);
    console.log(`  CrowdFundingFactory:  ${factoryAddress}\n`);

    console.log("👥 Ownership:");
    console.log(`  Token Owner:          ${tokenOwner} (Factory)`);
    console.log(`  Factory Owner:        ${currentOwner}`);
    console.log(`  Previous Owner:       ${deployer.address} (Deployer)\n`);

    console.log("✅ Verification Status:");
    console.log(`  CrowdFundingToken:    ${deploymentInfo.contracts.CrowdFundingToken.verified ? "✅ Verified" : "❌ Not Verified"}`);
    console.log(`  CrowdFunding:         ${deploymentInfo.contracts.CrowdFunding.verified ? "✅ Verified" : "❌ Not Verified"}`);
    console.log(`  CrowdFundingFactory:  ${deploymentInfo.contracts.CrowdFundingFactory.verified ? "✅ Verified" : "❌ Not Verified"}\n`);

    console.log("🔐 Important Notes:");
    console.log("  1. Save the contract addresses above");
    console.log("  2. Factory ownership transferred to: " + factoryOwner);
    console.log("  3. Token ownership transferred to Factory for minting");
    console.log("  4. Deployer no longer has admin access");
    console.log("  5. Use Factory to create new crowdfunding campaigns\n");

    console.log("📄 Deployment file saved to:");
    console.log(`  ${deploymentFile}\n`);

    console.log("🔗 Useful Links:");
    if (networkName.includes('bsc')) {
        const explorerBase = networkName === 'bsc'
            ? 'https://bscscan.com'
            : 'https://testnet.bscscan.com';
        console.log(`  Token:   ${explorerBase}/address/${tokenAddress}`);
        console.log(`  Impl:    ${explorerBase}/address/${implementationAddress}`);
        console.log(`  Factory: ${explorerBase}/address/${factoryAddress}\n`);
    } else if (networkName.includes('polygon')) {
        const explorerBase = networkName === 'polygonAmoy'
            ? 'https://amoy.polygonscan.com'
            : 'https://polygonscan.com';
        console.log(`  Token:   ${explorerBase}/address/${tokenAddress}`);
        console.log(`  Impl:    ${explorerBase}/address/${implementationAddress}`);
        console.log(`  Factory: ${explorerBase}/address/${factoryAddress}\n`);
    }

    console.log("✨ Next Steps:");
    console.log("  1. Update frontend config with contract addresses");
    console.log("  2. Update subgraph.yaml with factory address");
    console.log("  3. Deploy subgraph: cd apps/subgraph/crowd-funding && graph deploy");
    console.log("  4. Test creating a campaign through the factory");
    console.log("  5. Fund campaigns and test the donation flow\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
