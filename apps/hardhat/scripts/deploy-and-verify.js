const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
require("dotenv").config();

// Gas tracking
let totalGasUsed = 0n;
let totalCostWei = 0n;

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
        'sepolia': 'ETH',
        'hardhat': 'ETH',
        'localhost': 'ETH'
    };
    return currencyMap[networkName] || 'ETH';
}

/**
 * Helper function to wait for transaction confirmations with retry
 */
async function waitForConfirmations(tx, confirmations = 1, maxRetries = 3) {
    console.log(`  Waiting for ${confirmations} confirmation(s)...`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const receipt = await tx.wait(confirmations);
            console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);

            // Track gas usage
            const gasUsed = receipt.gasUsed;
            const gasPrice = receipt.gasPrice || tx.gasPrice || 0n;
            const cost = gasUsed * gasPrice;

            totalGasUsed += gasUsed;
            totalCostWei += cost;

            console.log(`  ⛽ Gas used: ${gasUsed.toLocaleString()}`);
            console.log(`  💰 Cost: ${ethers.formatEther(cost)} ${getNetworkCurrency(hre.network.name)}`);

            return receipt;
        } catch (error) {
            if (attempt === maxRetries) {
                throw new Error(`Transaction failed after ${maxRetries} attempts: ${error.message}`);
            }
            console.log(`  ⚠️  Attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
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

/**
 * Validate environment variables
 */
function validateEnvironment() {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Environment Validation                               ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    const required = ['FACTORY_CONTRACT_OWNER'];
    const missing = [];

    for (const envVar of required) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (missing.length > 0) {
        throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate FACTORY_CONTRACT_OWNER address
    if (!ethers.isAddress(process.env.FACTORY_CONTRACT_OWNER)) {
        throw new Error(`❌ FACTORY_CONTRACT_OWNER is not a valid Ethereum address: ${process.env.FACTORY_CONTRACT_OWNER}`);
    }

    console.log(`  ✅ All required environment variables are set`);
    console.log(`  Factory Owner: ${process.env.FACTORY_CONTRACT_OWNER}\n`);

    return process.env.FACTORY_CONTRACT_OWNER;
}

/**
 * Verify contract with retries
 */
async function verifyContract(address, constructorArgs, contractPath, contractName, maxRetries = 3) {
    const explorerName = hre.network.name.includes('bsc') ? 'BscScan' :
        hre.network.name.includes('polygon') ? 'PolygonScan' : 'Etherscan';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`  Verifying ${contractName} on ${explorerName}... (Attempt ${attempt}/${maxRetries})`);

            const verifyArgs = {
                address: address,
                constructorArguments: constructorArgs
            };

            if (contractPath) {
                verifyArgs.contract = contractPath;
            }

            await hre.run("verify:verify", verifyArgs);
            console.log(`  ✅ ${contractName} verified`);
            return true;
        } catch (error) {
            if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
                console.log(`  ✅ ${contractName} already verified`);
                return true;
            }

            if (attempt === maxRetries) {
                console.log(`  ⚠️  ${contractName} verification failed after ${maxRetries} attempts: ${error.message}`);
                return false;
            }

            console.log(`  ⚠️  Verification attempt ${attempt} failed, retrying in 10 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }

    return false;
}

/**
 * Create deployment backup
 */
function createBackup(deploymentInfo, networkName) {
    const backupsDir = path.join(__dirname, '..', 'deployments', 'backups');
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupsDir, `${networkName}-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`  ✅ Backup saved to: ${backupFile}`);
}

async function main() {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   CrowdFunding Platform Deployment Script             ║");
    console.log("║   Production Ready v2.0                                ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    const startTime = Date.now();

    // Validate environment
    const factoryOwner = validateEnvironment();

    // Get network info
    const networkName = hre.network.name;
    const networkCurrency = getNetworkCurrency(networkName);
    const network = await ethers.provider.getNetwork();
    const chainId = Number(network.chainId);

    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Network Information                                  ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log(`  Network: ${networkName}`);
    console.log(`  Chain ID: ${chainId}`);
    console.log(`  Currency: ${networkCurrency}\n`);

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Deployer Information                                 ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log(`  Address: ${deployer.address}`);
    console.log(`  Balance: ${ethers.formatEther(balance)} ${networkCurrency}\n`);

    if (balance === 0n) {
        throw new Error("❌ Deployer account has no funds!");
    }

    // Warn if balance is low
    const minBalance = ethers.parseEther("0.1");
    if (balance < minBalance) {
        console.log(`  ⚠️  WARNING: Low balance. Recommended minimum: 0.1 ${networkCurrency}\n`);
    }

    // Confirmation prompt for mainnet deployments
    if (networkName === 'bsc' || networkName === 'ethereum' || networkName === 'polygon') {
        console.log("╔════════════════════════════════════════════════════════╗");
        console.log("║   ⚠️  MAINNET DEPLOYMENT WARNING ⚠️                    ║");
        console.log("╚════════════════════════════════════════════════════════╝");
        console.log(`  You are deploying to MAINNET: ${networkName}`);
        console.log(`  This will cost real ${networkCurrency}!`);
        console.log(`  Deployer: ${deployer.address}`);
        console.log(`  Factory Owner: ${factoryOwner}`);
        console.log("\n  Please verify all details are correct.");
        console.log("  Press Ctrl+C to cancel, or wait 10 seconds to continue...\n");

        await new Promise(resolve => setTimeout(resolve, 10000));
    }

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
    console.log(`  Block: ${tokenDeployTx?.blockNumber}`);

    // Wait for confirmations
    if (tokenDeployTx) {
        await waitForConfirmations(tokenDeployTx, networkName === 'localhost' || networkName === 'hardhat' ? 1 : 2);
    }
    console.log();

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
    console.log(`  Block: ${implementationDeployTx?.blockNumber}`);

    if (implementationDeployTx) {
        await waitForConfirmations(implementationDeployTx, networkName === 'localhost' || networkName === 'hardhat' ? 1 : 2);
    }
    console.log();

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
    console.log(`  Block: ${factoryDeployTx?.blockNumber}`);

    if (factoryDeployTx) {
        await waitForConfirmations(factoryDeployTx, networkName === 'localhost' || networkName === 'hardhat' ? 1 : 2);
    }
    console.log();

    // ============================================
    // STEP 4: Setup Token with Factory
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Step 4: Setup CrowdFundingToken with Factory        ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    console.log("  Transferring token ownership to factory...");
    const setupTx = await crowdFundingToken.setFactoryAndTransferOwnership(factoryAddress);
    await waitForConfirmations(setupTx, 1);

    // Verify token setup
    const tokenOwner = await crowdFundingToken.owner();
    if (tokenOwner.toLowerCase() !== factoryAddress.toLowerCase()) {
        throw new Error(`❌ Token ownership verification failed! Expected: ${factoryAddress}, Got: ${tokenOwner}`);
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

    // Don't transfer if same address
    let transferTx;
    let currentOwner = await factory.owner();
    let pendingOwner = null;

    if (currentOwner.toLowerCase() !== factoryOwner.toLowerCase()) {
        console.log("  Initiating ownership transfer...");
        transferTx = await factory.transferOwnership(factoryOwner);
        await waitForConfirmations(transferTx, 1);

        // Verify ownership transfer
        currentOwner = await factory.owner();

        // Check if this is a 2-step ownership (Ownable2Step)
        if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
            // Still the old owner, must be 2-step process
            try {
                pendingOwner = await factory.pendingOwner();
                console.log(`  ✅ Ownership transfer initiated (2-step process)`);
                console.log(`  ⚠️  Pending owner: ${pendingOwner}`);
                console.log(`  ℹ️  New owner must call acceptOwnership() to complete transfer`);
            } catch (e) {
                console.log(`  ⚠️  Warning: Could not verify pending owner`);
            }
        } else if (currentOwner.toLowerCase() === factoryOwner.toLowerCase()) {
            // Successfully transferred (1-step Ownable)
            console.log(`  ✅ Factory ownership successfully transferred!`);
        } else {
            throw new Error(`❌ Unexpected owner after transfer: ${currentOwner}`);
        }
    } else {
        console.log(`  ℹ️  Owner already set to: ${factoryOwner}`);
    }
    console.log(`  Current owner: ${currentOwner}\n`);

    // ============================================
    // STEP 6: Verify Deployment State
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Step 6: Verify Deployment State                     ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    // Get factory details
    const factoryToken = await factory.donationToken();
    const fundingFee = await factory.getFundingFee();
    const donationScale = await factory.getDonationScale();

    console.log("Contract Addresses:");
    console.log(`  CrowdFundingToken:    ${tokenAddress}`);
    console.log(`    └─ Owner:           ${tokenOwner}`);
    console.log(`  CrowdFunding (Impl):  ${implementationAddress}`);
    console.log(`  CrowdFundingFactory:  ${factoryAddress}`);
    console.log(`    └─ Owner:           ${currentOwner}`);

    console.log("\nFactory Configuration:");
    console.log(`  Implementation:       ${implementationAddress}`);
    console.log(`  Donation Token:       ${factoryToken}`);
    console.log(`  Funding Fee:          ${ethers.formatEther(fundingFee)} ${networkCurrency}`);
    console.log(`  Donation Scale:       ${donationScale}x`);

    // Validate configuration
    if (factoryToken.toLowerCase() !== tokenAddress.toLowerCase()) {
        throw new Error("❌ Factory token mismatch!");
    }

    console.log(`\n  ✅ All validations passed!\n`);

    // ============================================
    // STEP 7: Save Deployment Information
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Step 7: Save Deployment Information                 ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    const deploymentInfo = {
        network: networkName,
        chainId: chainId,
        deployer: deployer.address,
        factoryOwner: factoryOwner,
        pendingOwner: pendingOwner,
        timestamp: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        gasUsed: {
            total: totalGasUsed.toString(),
            totalCost: ethers.formatEther(totalCostWei),
            currency: networkCurrency
        },
        contracts: {
            CrowdFundingToken: {
                address: tokenAddress,
                transactionHash: tokenDeployTx?.hash || "",
                blockNumber: tokenDeployTx?.blockNumber || 0,
                owner: tokenOwner,
                verified: false,
                abi: "abis/CrowdFundingToken.json"
            },
            CrowdFunding: {
                address: implementationAddress,
                transactionHash: implementationDeployTx?.hash || "",
                blockNumber: implementationDeployTx?.blockNumber || 0,
                verified: false,
                abi: "abis/CrowdFunding.json"
            },
            CrowdFundingFactory: {
                address: factoryAddress,
                transactionHash: factoryDeployTx?.hash || "",
                blockNumber: factoryDeployTx?.blockNumber || 0,
                owner: currentOwner,
                verified: false,
                abi: "abis/CrowdFundingFactory.json",
                constructorArgs: {
                    implementation: implementationAddress,
                    donationTokenAddress: tokenAddress
                },
                config: {
                    fundingFee: ethers.formatEther(fundingFee),
                    donationScale: donationScale.toString()
                }
            }
        },
        transactions: {
            tokenDeployment: tokenDeployTx?.hash,
            implementationDeployment: implementationDeployTx?.hash,
            factoryDeployment: factoryDeployTx?.hash,
            tokenOwnershipTransfer: setupTx.hash,
            factoryOwnershipTransfer: transferTx?.hash
        }
    };

    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`  ✅ Deployment info saved to: ${deploymentFile}`);

    // Save to latest.json
    const latestFile = path.join(deploymentsDir, "latest.json");
    fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`  ✅ Latest deployment saved to: ${latestFile}`);

    // Create backup
    createBackup(deploymentInfo, networkName);
    console.log();

    // ============================================
    // STEP 8: Verify Contracts on Block Explorer
    // ============================================
    if (networkName !== "localhost" && networkName !== "hardhat") {
        console.log("╔════════════════════════════════════════════════════════╗");
        console.log("║   Step 8: Verify Contracts on Block Explorer          ║");
        console.log("╚════════════════════════════════════════════════════════╝");

        console.log("  Waiting 30 seconds for blockchain indexing...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        // Verify CrowdFundingToken
        const tokenVerified = await verifyContract(
            tokenAddress,
            [],
            "contracts/CrowdFundingToken.sol:CrowdFundingToken",
            "CrowdFundingToken"
        );
        deploymentInfo.contracts.CrowdFundingToken.verified = tokenVerified;

        // Verify CrowdFunding Implementation
        const implVerified = await verifyContract(
            implementationAddress,
            [],
            "contracts/CrowdFunding.sol:CrowdFunding",
            "CrowdFunding Implementation"
        );
        deploymentInfo.contracts.CrowdFunding.verified = implVerified;

        // Verify CrowdFundingFactory
        const factoryVerified = await verifyContract(
            factoryAddress,
            [implementationAddress, tokenAddress],
            "contracts/CrowdFundingFactory.sol:CrowdFundingFactory",
            "CrowdFundingFactory"
        );
        deploymentInfo.contracts.CrowdFundingFactory.verified = factoryVerified;

        // Update deployment files with verification status
        deploymentInfo.verificationTimestamp = new Date().toISOString();
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
        console.log(`  ✅ Verification status updated in deployment files\n`);
    }

    // ============================================
    // DEPLOYMENT SUMMARY
    // ============================================
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

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
    if (pendingOwner) {
        console.log(`  Pending Owner:        ${pendingOwner} ⚠️  Must accept ownership`);
    }
    console.log(`  Previous Owner:       ${deployer.address} (Deployer)\n`);

    console.log("⚙️  Configuration:");
    console.log(`  Funding Fee:          ${ethers.formatEther(fundingFee)} ${networkCurrency}`);
    console.log(`  Donation Scale:       ${donationScale}x (1 ${networkCurrency} = ${donationScale} tokens)\n`);

    console.log("✅ Verification Status:");
    console.log(`  CrowdFundingToken:    ${deploymentInfo.contracts.CrowdFundingToken.verified ? "✅ Verified" : "❌ Not Verified"}`);
    console.log(`  CrowdFunding:         ${deploymentInfo.contracts.CrowdFunding.verified ? "✅ Verified" : "❌ Not Verified"}`);
    console.log(`  CrowdFundingFactory:  ${deploymentInfo.contracts.CrowdFundingFactory.verified ? "✅ Verified" : "❌ Not Verified"}\n`);

    console.log("⛽ Gas Usage:");
    console.log(`  Total Gas:            ${totalGasUsed.toLocaleString()}`);
    console.log(`  Total Cost:           ${ethers.formatEther(totalCostWei)} ${networkCurrency}\n`);

    console.log("⏱️  Deployment Time:      ${duration} seconds\n");

    console.log("🔐 Important Notes:");
    console.log("  1. Save the contract addresses above");
    console.log("  2. Factory ownership transferred to: " + factoryOwner);
    console.log("  3. Token ownership transferred to Factory for minting");
    console.log("  4. Deployer no longer has admin access");
    console.log("  5. Use Factory to create new crowdfunding campaigns\n");

    console.log("📄 Deployment Files:");
    console.log(`  Main:   ${deploymentFile}`);
    console.log(`  Latest: ${latestFile}\n`);

    console.log("🔗 Block Explorer Links:");
    const explorerBase = networkName === 'bsc' ? 'https://bscscan.com' :
        networkName === 'bscTestnet' ? 'https://testnet.bscscan.com' :
            networkName === 'polygon' ? 'https://polygonscan.com' :
                networkName === 'polygonAmoy' ? 'https://amoy.polygonscan.com' :
                    networkName === 'ethereum' ? 'https://etherscan.io' :
                        networkName === 'sepolia' ? 'https://sepolia.etherscan.io' : null;

    if (explorerBase) {
        console.log(`  Token:   ${explorerBase}/address/${tokenAddress}`);
        console.log(`  Impl:    ${explorerBase}/address/${implementationAddress}`);
        console.log(`  Factory: ${explorerBase}/address/${factoryAddress}\n`);
    }

    console.log("✨ Next Steps:");
    console.log("  1. Update frontend .env.local:");
    console.log(`     NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`);
    console.log(`     NEXT_PUBLIC_TOKEN_ADDRESS=${tokenAddress}`);
    console.log(`     NEXT_PUBLIC_IMPLEMENTATION_ADDRESS=${implementationAddress}`);
    console.log("  2. Update frontend ABIs from artifacts/contracts/");
    console.log("  3. Update subgraph.yaml with factory address:");
    console.log(`     address: "${factoryAddress}"`);
    console.log("  4. Deploy subgraph:");
    console.log("     cd apps/subgraph/crowd-funding && npm run deploy");
    console.log("  5. Test creating a campaign through the factory");
    console.log("  6. Fund campaigns and test the donation flow\n");

    console.log("═══════════════════════════════════════════════════════════");
    console.log("  Deployment completed successfully! 🎉");
    console.log("═══════════════════════════════════════════════════════════\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n╔════════════════════════════════════════════════════════╗");
        console.error("║   ❌ DEPLOYMENT FAILED                                 ║");
        console.error("╚════════════════════════════════════════════════════════╝\n");
        console.error("Error:", error.message);
        if (error.stack) {
            console.error("\nStack Trace:");
            console.error(error.stack);
        }
        console.error("\nPlease check the error above and try again.\n");
        process.exit(1);
    });
