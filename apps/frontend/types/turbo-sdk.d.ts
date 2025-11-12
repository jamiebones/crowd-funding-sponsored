declare module '@ardrive/turbo-sdk' {
    export class TurboFactory {
        static authenticated(config: { privateKey: string }): TurboClient;
        static unauthenticated(): TurboClient;
    }

    export interface TurboClient {
        uploadFile(options: {
            fileStreamFactory: () => Buffer;
            fileSizeFactory: () => number;
            dataItemOpts?: {
                tags?: Array<{ name: string; value: string }>;
            };
        }): Promise<{ id: string }>;
        getBalance(options?: { owner?: string }): Promise<{ winc: string }>;
    }

    export class ArweaveSigner {
        // Add types as needed
    }
}
