import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Converts a contract address to the subgraph ID format
 * The subgraph incorrectly uses Bytes.fromUTF8(address.toHexString()) as ID
 * This creates a UTF-8 encoded version of the hex string
 * Example: "0xabc..." becomes "0x307861626..."
 */
export function addressToSubgraphId(address: string): string {
    // Convert the hex string to UTF-8 bytes representation
    const hexString = address.toLowerCase();
    let result = '0x';
    for (let i = 0; i < hexString.length; i++) {
        result += hexString.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return result;
}

/**
 * Converts a subgraph ID back to the contract address
 * Reverses the Bytes.fromUTF8 encoding
 * Example: "0x307861626..." becomes "0xabc..."
 */
export function subgraphIdToAddress(subgraphId: string): string {
    // Remove 0x prefix if present
    const hex = subgraphId.startsWith('0x') ? subgraphId.slice(2) : subgraphId;

    // Convert pairs of hex digits back to characters
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substr(i, 2), 16);
        result += String.fromCharCode(charCode);
    }

    return result;
}

