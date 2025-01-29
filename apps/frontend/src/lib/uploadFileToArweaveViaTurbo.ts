import { TurboAuthenticatedClient, TurboFactory, ArweaveSigner } from "@ardrive/turbo-sdk";

import fs from "fs";
import path from "path";



const generateTurbo = async () => {
    console.log("1")
    const Wallet_JSON = fs.readFileSync(path.join(process.cwd(), 'arweave-wallet.json'), 'utf8');
    console.log("2")
    try {
        const wallet = JSON.parse(Wallet_JSON);
        if (!wallet) {
            throw new Error("Wallet key not found");
        }
        const signer = new ArweaveSigner(wallet);
        const turbo = TurboFactory.authenticated({ signer });
        return turbo;
    } catch (error: any) {
        console.error("Error parsing wallet file:", error);
        throw new Error("Failed to initialize wallet: " + error.message);
    }

}

const uploadFileToArweaveUsingTurbo = async (turbo: TurboAuthenticatedClient, file: File, tags: { name: string, value: string }[]) => {
    const uploadResult = await turbo.uploadFile({
        fileStreamFactory: () => file.stream() as any,
        fileSizeFactory: () => file.size,
        dataItemOpts: {
            tags
        }
    });

    return uploadResult.id;
}

const uploadFileToArweaveUsingTurbo2 = async (turbo: TurboAuthenticatedClient, filePath: string, tags: { name: string, value: string }[]) => {

    const fileSize = fs.statSync(filePath).size;
    const uploadResult = await turbo.uploadFile({
        fileStreamFactory: () => fs.createReadStream(filePath),
        fileSizeFactory: () => fileSize,
        dataItemOpts: {
            tags
        }
    });

    return uploadResult.id;
}


const createJSONFile = (jsonData: object) => {
    const tempDir = '/tmp';
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    const jsonString = JSON.stringify(jsonData, null, 2);
    const tempFilePath = path.join(tempDir, 'temp.json');
    fs.writeFileSync(tempFilePath, jsonString, 'utf-8');
    return tempFilePath;
}

const writeFileToTempDir = async (file: File) => {
    const tempFilePath = path.join(process.cwd(), file.name);
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, fileBuffer);
    return tempFilePath;
}

const deleteJSONFile = (tempFilePath: string) => {
    fs.unlinkSync(tempFilePath);
    console.log("file deleted")
}



export {
    uploadFileToArweaveUsingTurbo,
    uploadFileToArweaveUsingTurbo2,
    createJSONFile,
    deleteJSONFile,
    writeFileToTempDir,
    generateTurbo
}