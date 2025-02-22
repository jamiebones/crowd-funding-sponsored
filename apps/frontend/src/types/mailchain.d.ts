declare module '@mailchain/sdk' {
  export interface SendMailParams {
    from: string;
    to: string[];
    subject: string;
    content: {
      text: string;
      html: string;
    };
  }

  export class Mailchain {
    static fromSecretRecoveryPhrase(phrase: string): Mailchain;
    sendMail(params: SendMailParams): Promise<{ data: any; error: any }>;
    user(): Promise<{ address: string }>;
  }
} 