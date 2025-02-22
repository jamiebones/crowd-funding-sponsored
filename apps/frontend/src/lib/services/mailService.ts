import { Mailchain, SendMailParams } from '@mailchain/sdk';
import fs from 'fs';
import path from 'path';

interface EmailTemplateData {
    title: string;
    logoUrl: string;
    heading: string;
    mainContent: string;
    callToAction?: boolean;
    ctaUrl?: string;
    ctaText?: string;
    senderName: string;
    companyName: string;
    companyAddress: string;
    supportEmail: string;
}

const MailService = {
    async send(params: SendMailParams) {
        const secretRecoveryPhrase = process.env.SECRET_RECOVERY_PHRASE;
        if (secretRecoveryPhrase == null) {
            throw new Error('You must provide a secret recovery phrase');
        }
        const mailchain = Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase);

        if (!params.from || params.from === '') {
            // set the from address to current user if not provided
            const currentUser = await mailchain.user();
            params.from = currentUser.address;
        }

        const { data, error } = await mailchain.sendMail(params);
        if (error) {
            throw new Error('Mailchain error: ' + error.message);
        }

        return data;
    },

    async sendWithTemplate(params: Omit<SendMailParams, 'content'> & { templateData: EmailTemplateData }) {
        // Read the template file
        const templatePath = path.join(process.cwd(), 'src/lib/email-templates/template.html');
        let template = fs.readFileSync(templatePath, 'utf-8');

        // Replace all placeholders with actual data
        const { templateData } = params;
        Object.entries(templateData).forEach(([key, value]) => {
            template = template.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        });

        // Handle conditional CTA button
        if (!templateData.callToAction) {
            template = template.replace(/{{#if callToAction}}[\s\S]*?{{\/if}}/g, '');
        }

        // Create new params with the populated template
        const emailParams: SendMailParams = {
            ...params,
            content: {
                html: template,
                text: stripHtml(template), // You'll need to implement stripHtml function
            },
        };

        return this.send(emailParams);
    }
}

// Helper function to strip HTML tags for text version
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// sendMail.send({
//     from: 'test@test.com',
//     to: ['test@test.com'],
//     subject: 'Test',
//     content: {
//         text: 'Hello, world!',
//         html: '<p>Hello, world!</p>'
//     }
// });

export default MailService;