import * as fs from "fs";
import * as path from "path";

interface ExportFormat {
    typescript?: boolean;
    json?: boolean;
    env?: boolean;
}

function exportToTypeScript(deploymentInfo: any, outputPath: string): void {
    const content = `// Auto-generated deployment addresses
// Network: ${deploymentInfo.network}
// Deployed: ${deploymentInfo.timestamp}

export const CONTRACTS = {
  CrowdFundingToken: "${deploymentInfo.contracts.CrowdFundingToken.address}",
  CrowdFunding: "${deploymentInfo.contracts.CrowdFunding.address}",
  CrowdFundingFactory: "${deploymentInfo.contracts.CrowdFundingFactory.address}",
} as const;

export const NETWORK_INFO = {
  network: "${deploymentInfo.network}",
  chainId: ${deploymentInfo.chainId},
  deployer: "${deploymentInfo.deployer}",
  timestamp: "${deploymentInfo.timestamp}",
} as const;

export const FACTORY_ADDRESS = CONTRACTS.CrowdFundingFactory;
export const TOKEN_ADDRESS = CONTRACTS.CrowdFundingToken;
export const IMPLEMENTATION_ADDRESS = CONTRACTS.CrowdFunding;
`;

    fs.writeFileSync(outputPath, content);
    console.log(`✅ TypeScript config exported to: ${outputPath}`);
}

function exportToEnv(deploymentInfo: any, outputPath: string): void {
    const content = `# Auto-generated deployment addresses
# Network: ${deploymentInfo.network}
# Deployed: ${deploymentInfo.timestamp}

NEXT_PUBLIC_FACTORY_ADDRESS=${deploymentInfo.contracts.CrowdFundingFactory.address}
NEXT_PUBLIC_TOKEN_ADDRESS=${deploymentInfo.contracts.CrowdFundingToken.address}
NEXT_PUBLIC_IMPLEMENTATION_ADDRESS=${deploymentInfo.contracts.CrowdFunding.address}
NEXT_PUBLIC_NETWORK=${deploymentInfo.network}
NEXT_PUBLIC_CHAIN_ID=${deploymentInfo.chainId}
`;

    fs.writeFileSync(outputPath, content);
    console.log(`✅ ENV file exported to: ${outputPath}`);
}

function exportToSubgraphConfig(deploymentInfo: any, outputPath: string): void {
    const content = `# Subgraph configuration for ${deploymentInfo.network}
# This file can be used to update subgraph.yaml

network: ${deploymentInfo.network === 'bscTestnet' ? 'chapel' : deploymentInfo.network}
factoryAddress: "${deploymentInfo.contracts.CrowdFundingFactory.address}"
startBlock: ${deploymentInfo.contracts.CrowdFundingFactory.blockNumber}
chainId: ${deploymentInfo.chainId}
`;

    fs.writeFileSync(outputPath, content);
    console.log(`✅ Subgraph config exported to: ${outputPath}`);
}

async function main() {
    const args = process.argv.slice(2);
    const networkName = args[0] || process.env.NETWORK;

    if (!networkName) {
        console.error("❌ Please provide a network name");
        console.log("\nUsage: npm run export-addresses <network> [format]");
        console.log("\nExamples:");
        console.log("  npm run export-addresses bscTestnet");
        console.log("  npm run export-addresses bscTestnet typescript");
        console.log("  npm run export-addresses bscTestnet all");
        process.exit(1);
    }

    const format = args[1] || "all";

    // Load deployment info
    const deploymentFile = path.join(
        __dirname,
        "..",
        "deployments",
        `${networkName}.json`
    );

    if (!fs.existsSync(deploymentFile)) {
        console.error(`❌ Deployment file not found: ${deploymentFile}`);
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

    console.log("=".repeat(60));
    console.log("📤 EXPORTING DEPLOYMENT ADDRESSES");
    console.log("=".repeat(60));
    console.log(`\nNetwork: ${deploymentInfo.network}`);
    console.log(`Chain ID: ${deploymentInfo.chainId}\n`);

    const exportsDir = path.join(__dirname, "..", "exports");
    if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Export based on format
    if (format === "typescript" || format === "all") {
        exportToTypeScript(
            deploymentInfo,
            path.join(exportsDir, `${networkName}.ts`)
        );
    }

    if (format === "env" || format === "all") {
        exportToEnv(
            deploymentInfo,
            path.join(exportsDir, `${networkName}.env`)
        );
    }

    if (format === "subgraph" || format === "all") {
        exportToSubgraphConfig(
            deploymentInfo,
            path.join(exportsDir, `${networkName}-subgraph.txt`)
        );
    }

    if (format === "json" || format === "all") {
        const jsonOutput = {
            factoryAddress: deploymentInfo.contracts.CrowdFundingFactory.address,
            tokenAddress: deploymentInfo.contracts.CrowdFundingToken.address,
            implementationAddress: deploymentInfo.contracts.CrowdFunding.address,
            network: deploymentInfo.network,
            chainId: deploymentInfo.chainId,
            startBlock: deploymentInfo.contracts.CrowdFundingFactory.blockNumber,
        };

        const jsonPath = path.join(exportsDir, `${networkName}-addresses.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
        console.log(`✅ JSON config exported to: ${jsonPath}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Export complete!");
    console.log("=".repeat(60));
    console.log(`\nExported files are in: ${exportsDir}`);
    console.log("\n💡 Next steps:");
    console.log("1. Copy TypeScript config to frontend");
    console.log("2. Update subgraph.yaml with factory address and start block");
    console.log("3. Add ENV variables to .env files\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
