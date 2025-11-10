const fs = require('fs');
const path = require('path');
require("dotenv").config();

async function main() {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   CrowdFunding Contract Verification Script           ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    // Get network info
    const networkName = hre.network.name;
    console.log(`Network: ${networkName}`);
    console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}\n`);

    // Load deployment info
    const deploymentFile = path.join(__dirname, '..', 'deployments', `${networkName}.json`);
    
    if (!fs.existsSync(deploymentFile)) {
        throw new Error(`❌ Deployment file not found: ${deploymentFile}`);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

    console.log("📋 Loaded Deployment Information:");
    console.log(`  Network:        ${deploymentInfo.network}`);
    console.log(`  Chain ID:       ${deploymentInfo.chainId}`);
    console.log(`  Deployer:       ${deploymentInfo.deployer}`);
    console.log(`  Factory Owner:  ${deploymentInfo.factoryOwner}`);
    console.log(`  Deployed:       ${deploymentInfo.timestamp}\n`);

    const tokenAddress = deploymentInfo.contracts.CrowdFundingToken.address;
    const implementationAddress = deploymentInfo.contracts.CrowdFunding.address;
    const factoryAddress = deploymentInfo.contracts.CrowdFundingFactory.address;
    const constructorArgs = deploymentInfo.contracts.CrowdFundingFactory.constructorArgs;

    console.log("📋 Contract Addresses:");
    console.log(`  CrowdFundingToken:    ${tokenAddress}`);
    console.log(`  CrowdFunding (Impl):  ${implementationAddress}`);
    console.log(`  CrowdFundingFactory:  ${factoryAddress}\n`);

    // ============================================
    // VERIFY CONTRACTS ON BLOCK EXPLORER
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   Verifying Contracts on Block Explorer               ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

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
            // Continue even if verification fails
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
            // Continue even if verification fails
        }
    }

    // Verify CrowdFundingFactory (with constructor args)
    try {
        console.log(`  Verifying CrowdFundingFactory on ${explorerName}...`);
        console.log(`    Constructor args: [${constructorArgs.implementation}, ${constructorArgs.donationTokenAddress}]`);
        await hre.run("verify:verify", {
            address: factoryAddress,
            constructorArguments: [constructorArgs.implementation, constructorArgs.donationTokenAddress],
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
            // Continue even if verification fails
        }
    }

    // Update deployment file with verification status
    deploymentInfo.verificationTimestamp = new Date().toISOString();
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    // Also update latest.json
    const latestFile = path.join(__dirname, '..', 'deployments', "latest.json");
    fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n  ✅ Verification status updated in deployment files\n`);

    // ============================================
    // VERIFICATION SUMMARY
    // ============================================
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   VERIFICATION COMPLETE! 🚀                            ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    console.log("✅ Verification Status:");
    console.log(`  CrowdFundingToken:    ${deploymentInfo.contracts.CrowdFundingToken.verified ? "✅ Verified" : "❌ Not Verified"}`);
    console.log(`  CrowdFunding:         ${deploymentInfo.contracts.CrowdFunding.verified ? "✅ Verified" : "❌ Not Verified"}`);
    console.log(`  CrowdFundingFactory:  ${deploymentInfo.contracts.CrowdFundingFactory.verified ? "✅ Verified" : "❌ Not Verified"}\n`);

    console.log("🔗 Block Explorer Links:");
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

    console.log("📄 Deployment files updated:");
    console.log(`  ${deploymentFile}`);
    console.log(`  ${latestFile}\n`);

    console.log("✨ Next Steps:");
    console.log("  1. Update frontend config with contract addresses");
    console.log("  2. Update subgraph.yaml with factory address");
    console.log("  3. Deploy subgraph: cd apps/subgraph/crowd-funding && graph deploy");
    console.log("  4. Test creating a campaign through the factory\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Verification failed:", error);
        process.exit(1);
    });
