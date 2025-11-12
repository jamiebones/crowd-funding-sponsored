/**
 * Helper script to convert Ethereum private key to JWK format for Turbo SDK
 * 
 * Run this once to convert your MetaMask private key:
 * node scripts/convert-eth-key-to-jwk.js
 */

const crypto = require('crypto');

// Your Ethereum private key from MetaMask (replace this)
const ETH_PRIVATE_KEY = process.env.TURBO_WALLET_PRIVATE_KEY || '0xYourPrivateKeyHere';

function ethPrivateKeyToJWK(privateKeyHex) {
    // Remove 0x prefix if present
    const cleanKey = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;

    // Convert hex to buffer
    const keyBuffer = Buffer.from(cleanKey, 'hex');

    // For Ethereum/secp256k1, create a JWK
    // Note: This is a simplified version - Turbo may need different format
    const jwk = {
        kty: 'EC',
        crv: 'secp256k1',
        d: keyBuffer.toString('base64url'),
        use: 'sig',
        alg: 'ES256K'
    };

    return jwk;
}

if (require.main === module) {
    if (!ETH_PRIVATE_KEY || ETH_PRIVATE_KEY === '0xYourPrivateKeyHere') {
        console.error('Error: Please set TURBO_WALLET_PRIVATE_KEY environment variable');
        console.log('\nUsage:');
        console.log('  TURBO_WALLET_PRIVATE_KEY=0xyour_key node scripts/convert-eth-key-to-jwk.js');
        process.exit(1);
    }

    const jwk = ethPrivateKeyToJWK(ETH_PRIVATE_KEY);

    console.log('\n=== Your JWK for Turbo ===');
    console.log(JSON.stringify(jwk, null, 2));
    console.log('\n=== Add to .env.local ===');
    console.log('TURBO_WALLET_JWK=\'' + JSON.stringify(jwk) + '\'');
    console.log('\nNote: Turbo SDK might need Arweave JWK instead.');
    console.log('Check Turbo docs: https://docs.ardrive.io/docs/turbo/');
}

module.exports = { ethPrivateKeyToJWK };
