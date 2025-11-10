import * as fs from "fs";
import * as path from "path";
import { ethers, network } from "hardhat";

async function main() {
    const networkName = process.env.NETWORK || network.name;

    console.log("=".repeat(60));
    console.log("📊 DEPLOYMENT STATUS CHECK");
    console.log("=".repeat(60));
    console.log(`\nNetwork: ${networkName}\n`);

    // Load deployment info
    const deploymentFile = path.join(
        __dirname,
        "..",
        "deployments",
        `${networkName}.json`
    );

    if (!fs.existsSync(deploymentFile)) {
        console.error(`❌ No deployment found for network: ${networkName}`);
        console.log("\nAvailable deployments:");

        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (fs.existsSync(deploymentsDir)) {
            const files = fs.readdirSync(deploymentsDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    console.log(`  - ${file.replace('.json', '')}`);
                }
            });
        }
        process.exit(1);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));

    // Display deployment info
    console.log("📋 Deployment Information:");
    console.log(`Network: ${deploymentInfo.network}`);
    console.log(`Chain ID: ${deploymentInfo.chainId}`);
    console.log(`Deployer: ${deploymentInfo.deployer}`);
    console.log(`Factory Owner: ${deploymentInfo.factoryOwner || 'Not set (old deployment)'}`);
    console.log(`Timestamp: ${new Date(deploymentInfo.timestamp).toLocaleString()}\n`);

    console.log("📦 Deployed Contracts:\n");

    // CrowdFundingToken
    console.log("1️⃣  CrowdFundingToken");
    console.log(`   Address: ${deploymentInfo.contracts.CrowdFundingToken.address}`);
    console.log(`   TX Hash: ${deploymentInfo.contracts.CrowdFundingToken.transactionHash}`);
    console.log(`   Block: ${deploymentInfo.contracts.CrowdFundingToken.blockNumber}`);
    console.log(`   Verified: ${deploymentInfo.contracts.CrowdFundingToken.verified ? "✅" : "❌"}\n`);

    // CrowdFunding Implementation
    console.log("2️⃣  CrowdFunding (Implementation)");
    console.log(`   Address: ${deploymentInfo.contracts.CrowdFunding.address}`);
    console.log(`   TX Hash: ${deploymentInfo.contracts.CrowdFunding.transactionHash}`);
    console.log(`   Block: ${deploymentInfo.contracts.CrowdFunding.blockNumber}`);
    console.log(`   Verified: ${deploymentInfo.contracts.CrowdFunding.verified ? "✅" : "❌"}\n`);

    // CrowdFundingFactory
    console.log("3️⃣  CrowdFundingFactory");
    console.log(`   Address: ${deploymentInfo.contracts.CrowdFundingFactory.address}`);
    console.log(`   TX Hash: ${deploymentInfo.contracts.CrowdFundingFactory.transactionHash}`);
    console.log(`   Block: ${deploymentInfo.contracts.CrowdFundingFactory.blockNumber}`);
    console.log(`   Verified: ${deploymentInfo.contracts.CrowdFundingFactory.verified ? "✅" : "❌"}`);
    console.log(`   Owner: ${deploymentInfo.contracts.CrowdFundingFactory.owner || deploymentInfo.factoryOwner || 'Not recorded'}`);
    console.log(`   Constructor Args:`);
    console.log(`     - Implementation: ${deploymentInfo.contracts.CrowdFundingFactory.constructorArgs.implementation}`);
    console.log(`     - Token Address: ${deploymentInfo.contracts.CrowdFundingFactory.constructorArgs.donationTokenAddress}\n`);

    // Try to connect and check on-chain state
    try {
        const [signer] = await ethers.getSigners();

        console.log("🔍 On-Chain Verification:\n");

        // Check CrowdFundingToken
        const tokenContract = await ethers.getContractAt(
            "CrowdFundingToken",
            deploymentInfo.contracts.CrowdFundingToken.address
        );

        const tokenName = await tokenContract.name();
        const tokenSymbol = await tokenContract.symbol();
        const tokenCap = await tokenContract.cap();
        const tokenOwner = await tokenContract.owner();

        console.log("CrowdFundingToken:");
        console.log(`  Name: ${tokenName}`);
        console.log(`  Symbol: ${tokenSymbol}`);
        console.log(`  Cap: ${ethers.formatEther(tokenCap)} tokens`);
        console.log(`  Owner: ${tokenOwner}`);
        console.log(`  Owner is Factory: ${tokenOwner.toLowerCase() === deploymentInfo.contracts.CrowdFundingFactory.address.toLowerCase() ? "✅" : "❌"}\n`);

        // Check CrowdFundingFactory
        const factoryContract = await ethers.getContractAt(
            "CrowdFundingFactory",
            deploymentInfo.contracts.CrowdFundingFactory.address
        );

        const factoryOwner = await factoryContract.owner();
        const donationToken = await factoryContract.donationToken();

        const expectedOwner = deploymentInfo.contracts.CrowdFundingFactory.owner || deploymentInfo.factoryOwner;

        console.log("CrowdFundingFactory:");
        console.log(`  Owner: ${factoryOwner}`);
        console.log(`  Expected Owner: ${expectedOwner || 'Not recorded'}`);
        console.log(`  Owner Match: ${expectedOwner && factoryOwner.toLowerCase() === expectedOwner.toLowerCase() ? "✅" : "⚠️"}`);
        console.log(`  Donation Token: ${donationToken}`);
        console.log(`  Token Match: ${donationToken.toLowerCase() === deploymentInfo.contracts.CrowdFundingToken.address.toLowerCase() ? "✅" : "❌"}\n`);

    } catch (error: any) {
        console.log("⚠️  Could not verify on-chain state (wrong network?)");
        console.log(`Error: ${error.message}\n`);
    }

    console.log("=".repeat(60));
    console.log("\n💡 Quick Commands:");
    console.log(`\n# Verify contracts:`);
    console.log(`npx hardhat run scripts/verify.ts --network ${networkName}`);
    console.log(`\n# Interact with contracts:`);
    console.log(`npx hardhat console --network ${networkName}`);
    console.log("\n" + "=".repeat(60) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
