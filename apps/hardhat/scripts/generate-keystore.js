

const fs = require("fs");
const path = require("path");
const { Wallet } = require("ethers");

require("dotenv").config();

async function main() {
    // 1) Create a new random wallet
    const wallet = Wallet.createRandom();
    console.log("New address:", wallet.address);

    // 2) Ask for password from env variable
    const password = process.env.KEY_PASSWORD;
    if (!password) {
        console.error("Set KEY_PASSWORD in your .env before running this script.");
        process.exit(1);
    }

    // 3) Encrypt wallet to JSON (returns a Promise<string>)
    const encryptedJson = await wallet.encrypt(password);

    // 4) Save to keystore file
    const keystoreDir = path.join(__dirname, "..", "keystore");
    if (!fs.existsSync(keystoreDir)) fs.mkdirSync(keystoreDir);
    const filename = path.join(keystoreDir, `UTC--${new Date().toISOString()}--${wallet.address}.json`);
    fs.writeFileSync(filename, encryptedJson);
    // tighten file permissions
    try { fs.chmodSync(filename, 0o600); } catch (e) {  }
    console.log("Keystore saved to:", filename);
    
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

