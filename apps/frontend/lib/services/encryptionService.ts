import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

/**
 * Derives an encryption key from the master password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Gets the master encryption key from environment variable
 */
function getMasterKey(): string {
    const key = process.env.WALLET_ENCRYPTION_KEY;
    if (!key) {
        throw new Error('WALLET_ENCRYPTION_KEY environment variable is not set');
    }
    if (key.length < 32) {
        throw new Error('WALLET_ENCRYPTION_KEY must be at least 32 characters long');
    }
    return key;
}

/**
 * Encrypts a private key using AES-256-GCM
 * Returns an object with encrypted data, salt, iv, and authTag
 */
export function encryptPrivateKey(privateKey: string): {
    encryptedData: string;
    salt: string;
    iv: string;
    authTag: string;
} {
    try {
        const masterPassword = getMasterKey();

        // Remove '0x' prefix if present
        const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

        // Generate random salt and IV
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);

        // Derive encryption key from master password
        const key = deriveKey(masterPassword, salt);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        // Encrypt the private key
        let encrypted = cipher.update(cleanKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get authentication tag
        const authTag = cipher.getAuthTag();

        return {
            encryptedData: encrypted,
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    } catch (error) {
        throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Decrypts an encrypted private key
 * Returns the original private key with '0x' prefix
 */
export function decryptPrivateKey(
    encryptedData: string,
    salt: string,
    iv: string,
    authTag: string
): string {
    try {
        const masterPassword = getMasterKey();

        // Convert hex strings to buffers
        const saltBuffer = Buffer.from(salt, 'hex');
        const ivBuffer = Buffer.from(iv, 'hex');
        const authTagBuffer = Buffer.from(authTag, 'hex');

        // Derive the same encryption key
        const key = deriveKey(masterPassword, saltBuffer);

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
        decipher.setAuthTag(authTagBuffer);

        // Decrypt
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        // Add '0x' prefix
        return `0x${decrypted}`;
    } catch (error) {
        throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Stores encrypted private key as a single string
 * Format: salt:iv:authTag:encryptedData
 */
export function encryptPrivateKeyToString(privateKey: string): { encryptedString: string; salt: string } {
    const { encryptedData, salt, iv, authTag } = encryptPrivateKey(privateKey);
    const encryptedString = `${iv}:${authTag}:${encryptedData}`;
    return { encryptedString, salt };
}

/**
 * Decrypts private key from string format
 * Format: iv:authTag:encryptedData
 */
export function decryptPrivateKeyFromString(encryptedString: string, salt: string): string {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted string format');
    }

    const [iv, authTag, encryptedData] = parts;
    return decryptPrivateKey(encryptedData, salt, iv, authTag);
}

/**
 * Validates that a string is a valid Ethereum private key
 */
export function validatePrivateKey(privateKey: string): boolean {
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    return /^[a-fA-F0-9]{64}$/.test(cleanKey);
}

/**
 * Generates a random encryption key for WALLET_ENCRYPTION_KEY
 * This should be run once and stored securely
 */
export function generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
}
