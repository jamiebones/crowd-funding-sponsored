# Contract Deployment Guide

This guide explains how to deploy and verify the CrowdFunding smart contracts.

## Prerequisites

1. Node.js and npm/pnpm installed
2. Environment variables configured in `.env` file:
   ```env
   PRIVATE_KEY=your_deployer_private_key
   FACTORY_CONTRACT_OWNER=0xAddressToReceiveFactoryOwnership
   ETHERSCAN_API_KEY=your_bscscan_api_key
   RSK_TESTNET_RPC_URL=your_rsk_testnet_rpc
   RSK_MAINNET_RPC_URL=your_rsk_mainnet_rpc
   ```

3. Deployer wallet must have sufficient funds for:
   - Gas fees for deployment
   - Contract creation costs

**⚠️ IMPORTANT:** The `FACTORY_CONTRACT_OWNER` environment variable is **required**. After deployment, the factory contract ownership will be transferred to this address. Make sure this is a secure address (preferably a multi-sig or hardware wallet for production).

## Deployment Process

The deployment script automatically:
1. ✅ Validates `FACTORY_CONTRACT_OWNER` environment variable
2. ✅ Deploys **CrowdFundingToken** contract
3. ✅ Deploys **CrowdFunding** implementation contract
4. ✅ Deploys **CrowdFundingFactory** contract
5. ✅ Transfers token ownership to factory
6. ✅ Transfers factory ownership to `FACTORY_CONTRACT_OWNER`
7. ✅ Verifies all contracts on block explorer
8. ✅ Saves deployment information to `deployments/<network>.json`

### Quick Start

#### Deploy to BSC Testnet
```bash
cd apps/hardhat
npm run deploy:bscTestnet
```

#### Deploy to RSK Testnet
```bash
npm run deploy:rskTestnet
```

#### Deploy to RSK Mainnet
```bash
npm run deploy:rskMainnet
```

#### Deploy to Localhost (for testing)
```bash
# Terminal 1: Start local node
npm run node

# Terminal 2: Deploy contracts
npm run deploy:localhost
```

## Deployment Scripts

### Main Deployment Script
```bash
npm run deploy:bscTestnet    # Deploy to BSC Testnet
npm run deploy:rskTestnet    # Deploy to RSK Testnet
npm run deploy:rskMainnet    # Deploy to RSK Mainnet
```

### Verification (if auto-verify fails)
```bash
npm run verify:bscTestnet    # Verify on BSC Testnet
npm run verify:rskTestnet    # Verify on RSK Testnet
npm run verify:rskMainnet    # Verify on RSK Mainnet
```

### Check Deployment Status
```bash
npm run check:bscTestnet     # Check BSC Testnet deployment
npm run check:rskTestnet     # Check RSK Testnet deployment
npm run check:rskMainnet     # Check RSK Mainnet deployment
```

## Contract Architecture

```
┌─────────────────────────┐
│  CrowdFundingToken      │  ← ERC20 token for donations
│  (MWG-DT)               │     Owner: Factory
└─────────────────────────┘
           ▲
           │ uses
           │
┌─────────────────────────┐
│  CrowdFundingFactory    │  ← Creates new campaigns
│  (Main Entry Point)     │     Owner: FACTORY_CONTRACT_OWNER (env)
└─────────────────────────┘
           │
           │ clones
           ▼
┌─────────────────────────┐
│  CrowdFunding           │  ← Implementation contract
│  (Template)             │     Cloned for each campaign
└─────────────────────────┘
```

**Ownership Flow:**
1. Deployer deploys all contracts (temporary owner of factory)
2. Token ownership transferred to Factory
3. Factory ownership transferred to `FACTORY_CONTRACT_OWNER` address
4. Deployer no longer has control over factory or token

## Deployment Files

After deployment, you'll find deployment information in:
- `deployments/<network>.json` - Network-specific deployment data
- `deployments/latest.json` - Most recent deployment (any network)

### Example Deployment File Structure
```json
{
  "network": "bscTestnet",
  "chainId": 97,
  "deployer": "0x...",
  "factoryOwner": "0x...",
  "timestamp": "2025-11-10T...",
  "contracts": {
    "CrowdFundingToken": {
      "address": "0x...",
      "transactionHash": "0x...",
      "blockNumber": 12345,
      "verified": true
    },
    "CrowdFunding": {
      "address": "0x...",
      "transactionHash": "0x...",
      "blockNumber": 12346,
      "verified": true
    },
    "CrowdFundingFactory": {
      "address": "0x...",
      "transactionHash": "0x...",
      "blockNumber": 12347,
      "verified": true,
      "owner": "0x...",
      "constructorArgs": {
        "implementation": "0x...",
        "donationTokenAddress": "0x..."
      }
    }
  }
}
```

## Verification

Contracts are automatically verified during deployment. If automatic verification fails:

1. Wait 30-60 seconds for block explorer to index the contract
2. Run the verification script manually:
   ```bash
   npm run verify:bscTestnet
   ```

3. Or verify individually using Hardhat:
   ```bash
   npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> [CONSTRUCTOR_ARGS]
   ```

## Post-Deployment Steps

After successful deployment:

1. **Update Frontend Configuration**
   - Copy contract addresses to frontend config
   - Update network settings

2. **Update Subgraph**
   - Update `subgraph.yaml` with factory contract address
   - Update ABIs if needed
   - Deploy subgraph

3. **Test Deployment**
   ```bash
   # Start Hardhat console
   npx hardhat console --network bscTestnet
   
   # Load factory
   const factory = await ethers.getContractAt("CrowdFundingFactory", "FACTORY_ADDRESS")
   
   # Check setup
   await factory.owner()
   await factory.donationToken()
   ```

4. **Create Test Campaign**
   - Use frontend or console to create a test campaign
   - Verify events are emitted correctly
   - Check subgraph indexing

## Troubleshooting

### Deployment Fails
- Check deployer has sufficient funds
- Verify RPC URL is correct
- Check network is accessible
- **Ensure `FACTORY_CONTRACT_OWNER` is set in .env**
- **Verify `FACTORY_CONTRACT_OWNER` is a valid Ethereum address**

### "FACTORY_CONTRACT_OWNER environment variable is not set"
- Add `FACTORY_CONTRACT_OWNER=0xYourAddress` to your `.env` file
- Make sure the address is valid (checksummed or lowercase)
- For production, use a multi-sig or hardware wallet address

### Verification Fails
- Wait longer (block explorer indexing delay)
- Check API key is correct
- Use manual verification script
- Verify on block explorer UI manually

### "Already Verified" Error
- This is normal if re-running verification
- Contract is already verified, no action needed

### Gas Estimation Errors
- Increase gas limit in hardhat.config.ts
- Check deployer wallet balance
- Try increasing gas price

## Network-Specific Notes

### BSC Testnet
- Faucet: https://testnet.bnbchain.org/faucet-smart
- Explorer: https://testnet.bscscan.com
- API Key: BscScan API key required

### RSK Testnet
- Faucet: https://faucet.rsk.co
- Explorer: https://rootstock-testnet.blockscout.com
- Verification: Blockscout (no API key needed)

### RSK Mainnet
- Explorer: https://rootstock.blockscout.com
- Bridge: https://rootstock.io/rsk-token-bridge
- Verification: Blockscout (no API key needed)

## Security Checklist

Before mainnet deployment:

- [ ] All tests passing (191/191)
- [ ] Security audit completed
- [ ] Environment variables secured
- [ ] **`FACTORY_CONTRACT_OWNER` set to secure address (multi-sig recommended)**
- [ ] Deployer key is hardware wallet or secure key management
- [ ] Factory ownership will transfer to `FACTORY_CONTRACT_OWNER` (verify address!)
- [ ] Token ownership transferred to factory (automatic)
- [ ] Emergency procedures documented
- [ ] Gas estimation verified
- [ ] Contract verified on explorer
- [ ] Frontend tested with deployed contracts
- [ ] Backup of all deployment files
- [ ] Ownership transfer confirmed on-chain

## Support

For issues or questions:
1. Check deployment logs in terminal
2. Review `deployments/<network>.json` file
3. Use `npm run check:<network>` to verify deployment
4. Check Hardhat documentation: https://hardhat.org
