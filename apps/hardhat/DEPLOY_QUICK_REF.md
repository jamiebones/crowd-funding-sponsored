# Deployment Quick Reference

## 🚀 Deploy to Network

```bash
cd apps/hardhat

# BSC Testnet
npm run deploy:bscTestnet

# RSK Testnet  
npm run deploy:rskTestnet

# RSK Mainnet
npm run deploy:rskMainnet

# Local (for testing)
npm run deploy:localhost
```

## 📊 Check Deployment Status

```bash
npm run check:bscTestnet
npm run check:rskTestnet
npm run check:rskMainnet
```

## 🔍 Verify Contracts

```bash
npm run verify:bscTestnet
npm run verify:rskTestnet
npm run verify:rskMainnet
```

## 📤 Export Addresses

```bash
# Export all formats (TypeScript, JSON, ENV, Subgraph)
npm run export-addresses bscTestnet

# Export specific format
npm run export-addresses bscTestnet typescript
npm run export-addresses bscTestnet env
npm run export-addresses bscTestnet json
npm run export-addresses bscTestnet subgraph
```

## 📁 Files Created

### After Deployment
- `deployments/<network>.json` - Full deployment info
- `deployments/latest.json` - Latest deployment (any network)

### After Export
- `exports/<network>.ts` - TypeScript config
- `exports/<network>.env` - Environment variables
- `exports/<network>-addresses.json` - JSON config
- `exports/<network>-subgraph.txt` - Subgraph config

## 🔑 Contract Addresses

After deployment, get addresses from:
```bash
cat deployments/bscTestnet.json | grep address
```

Or use check command:
```bash
npm run check:bscTestnet
```

## 📋 Deployment Order

1. **CrowdFundingToken** - ERC20 token (MWG-DT)
2. **CrowdFunding** - Implementation template
3. **CrowdFundingFactory** - Factory contract
4. **Setup** - Transfer token ownership to factory

## ⚡ Quick Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to testnet
npm run deploy:bscTestnet

# Check deployment
npm run check:bscTestnet

# Export for frontend
npm run export-addresses bscTestnet typescript

# Verify contracts
npm run verify:bscTestnet
```

## 🛠️ Troubleshooting

### Deployment fails
- Check wallet has funds
- Verify RPC URL in .env
- Check network connectivity

### Verification fails
- Wait 30-60 seconds and retry
- Use manual verify script
- Check API key is correct

### Need to redeploy
- Just run deploy script again
- Previous deployment saved in `deployments/<network>.json`
- Can export old addresses anytime

## 📚 Documentation

Full documentation: `DEPLOYMENT.md`
