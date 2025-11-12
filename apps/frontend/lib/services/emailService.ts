import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Gmail SMTP Configuration
const createTransporter = (): Transporter => {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
        throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailUser,
            pass: gmailAppPassword,
        },
    });
};

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export const sendEmail = async ({ to, subject, html, text }: EmailOptions): Promise<boolean> => {
    try {
        const transporter = createTransporter();

        const emailFrom = process.env.EMAIL_FROM || process.env.GMAIL_USER;
        const subjectPrefix = process.env.EMAIL_SUBJECT_PREFIX || '[MWG Crowdfunding]';

        const mailOptions = {
            from: emailFrom,
            to,
            subject: `${subjectPrefix} ${subject}`,
            html,
            text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
};

export default { sendEmail };
