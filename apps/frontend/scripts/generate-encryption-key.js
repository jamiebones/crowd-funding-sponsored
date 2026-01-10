#!/usr/bin/env node

const crypto = require('crypto');

console.log('\n==============================================');
console.log('  Server Wallet Encryption Key Generator');
console.log('==============================================\n');

const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('Generated Encryption Key:');
console.log('');
console.log(`  ${encryptionKey}`);
console.log('');
console.log('Add this to your .env.local file:');
console.log('');
console.log(`  WALLET_ENCRYPTION_KEY=${encryptionKey}`);
console.log('');
console.log('⚠️  IMPORTANT:');
console.log('  - Keep this key secure and never commit it to git');
console.log('  - Store it in a password manager or secrets vault');
console.log('  - If you lose this key, you cannot decrypt existing wallets');
console.log('  - Use different keys for development and production');
console.log('');
console.log('==============================================\n');
