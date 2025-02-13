import { Document } from 'mongoose';
import { EmailType } from '@/app/types/EmailType';

export interface ICronJobExecution extends Document {
  emailType: EmailType;
  startTime: Date;
  endTime: Date;
  response: string;
  date: Date;
}

