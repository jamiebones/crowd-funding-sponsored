import { Document } from 'mongoose';
import { EmailType } from '@/app/types/EmailType';

interface IRecipient {
    id: string;
    email: string;
}

export interface IEmailCampaign extends Document {
    date: Date;
    emailType: EmailType;
    recipients: IRecipient[];
}