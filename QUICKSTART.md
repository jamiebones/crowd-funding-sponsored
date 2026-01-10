# Quick Start Guide - Server Wallet Management

Get up and running with server-side campaign creation in 5 minutes.

## Prerequisites

- Node.js installed
- MongoDB running (local or Atlas)
- BSC testnet or mainnet RPC access
- Private key of a wallet with some BNB

## Step 1: Generate Encryption Key (30 seconds)

```bash
cd apps/frontend
node scripts/generate-encryption-key.js
```

Copy the generated key.

## Step 2: Configure Environment (1 minute)

Create or update `apps/frontend/.env.local`:

```bash
# Add these new lines
WALLET_ENCRYPTION_KEY=paste_your_generated_key_here
BSC_RPC_URL=https://bsc-dataseed.binance.org

# Verify these existing lines
MONGODB_URI=mongodb://localhost:27017/crowdfunding
NEXT_PUBLIC_FACTORY_ADDRESS=0x9C413E92bf610Ccd0Cd044c3ba25876764AB8FDD
NEXT_PUBLIC_TOKEN_ADDRESS=0x9C04995284E6015fF45068dc78f6Dd8263581dF9
```

**For BSC Testnet:**
```bash
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
```

## Step 3: Start Application (30 seconds)

```bash
# If not already running
npm run dev
```

## Step 4: Import Wallet (1 minute)

1. Open browser: `http://localhost:3000/admin/wallets`
2. Click **"Import Wallet"**
3. Paste your private key (with or without `0x` prefix)
4. Click **"Import"**

✅ Your wallet is now encrypted and stored!

## Step 5: Sync Balance (30 seconds)

1. Click **"🔄 Sync Balances"** button
2. Wait for confirmation
3. Verify BNB balance appears

## Step 6: Create Campaign (2 minutes)

1. Click **"Create Campaign"** next to your imported wallet
2. Fill out Step 1: Basic Info
   - Title, category, goal (BNB), duration (days)
3. Fill out Step 2: Content
   - Description, upload media files
   - Wait for Arweave upload to complete
4. Step 3: Review & Create
   - Verify details
   - Click **"🚀 Create Campaign"**
   - No wallet popup - transaction signed server-side!
   - Wait for blockchain confirmation (~5 seconds)

✅ Campaign created!

## What Just Happened?

1. ✅ Private key encrypted with AES-256-GCM
2. ✅ Stored securely in MongoDB with unique salt
3. ✅ BNB balance fetched from blockchain
4. ✅ Campaign transaction signed server-side
5. ✅ Transaction submitted to BSC
6. ✅ Campaign deployed on-chain
7. ✅ Audit log created
8. ✅ Campaign count incremented

## View Your Work

**Admin Dashboard:**
```
http://localhost:3000/admin/wallets
```

**Your Campaign:**
```
http://localhost:3000/projects/[campaign-address]
```

**Blockchain Explorer:**
```
https://bscscan.com/address/[campaign-address]
```
(or testnet: `https://testnet.bscscan.com/address/[campaign-address]`)

## Common Commands

**Generate New Encryption Key:**
```bash
node scripts/generate-encryption-key.js
```

**Import Wallet via API:**
```bash
curl -X POST http://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -d '{"privateKey":"0x..."}'
```

**List All Wallets:**
```bash
curl http://localhost:3000/api/wallets
```

**Sync Balances:**
```bash
curl -X POST http://localhost:3000/api/wallets/sync-balances
```

**Check Wallet Details:**
```bash
curl http://localhost:3000/api/wallets/0x...
```

## Troubleshooting

### "WALLET_ENCRYPTION_KEY environment variable is not set"
→ Add the key to `.env.local` and restart dev server (`Ctrl+C`, then `npm run dev`)

### "Insufficient balance"
→ Send BNB to your wallet address, then sync balances

### "Cannot find module '@/lib/db/dbConnect'"
→ Restart TypeScript server in VS Code (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")

### "MongoDB connection error"
→ Ensure MongoDB is running: `mongod` or check MongoDB Atlas connection string

### Transaction not confirming
→ Check BSC network status, verify RPC URL, ensure sufficient gas in wallet

## Next Steps

1. **Add More Wallets** - Import multiple wallets for different purposes
2. **Create More Campaigns** - Test batch campaign creation
3. **Set Up Cron Job** - Auto-sync balances every 5 minutes
4. **Add Authentication** - Protect admin routes (see SERVER_WALLET_SETUP.md)
5. **Monitor Balances** - Set up low balance alerts
6. **Deploy to Production** - Follow deployment guide in SERVER_WALLET_SETUP.md

## Need Help?

- **Full Documentation:** [SERVER_WALLET_README.md](./SERVER_WALLET_README.md)
- **Setup Guide:** [SERVER_WALLET_SETUP.md](./SERVER_WALLET_SETUP.md)
- **Implementation Details:** [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## Security Reminders

⚠️ **NEVER commit `.env.local` to git**  
⚠️ **Store encryption key securely**  
⚠️ **Use different keys for dev/prod**  
⚠️ **Add authentication before deploying**  
⚠️ **Monitor wallet balances regularly**  

---

**That's it!** You're now running server-side wallet management for automated campaign creation. 🎉
