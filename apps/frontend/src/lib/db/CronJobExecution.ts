import mongoose, { Schema } from 'mongoose';
import { EmailType } from '@/app/types/EmailType';
import { ICronJobExecution } from '@/app/interface/ICronJobExecution';



const CronJobExecutionSchema = new Schema({
  emailType: { 
    type: String, 
    enum: Object.values(EmailType),
    required: true 
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  response: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

export default mongoose.models.CronJobExecution || mongoose.model<ICronJobExecution>('CronJobExecution', CronJobExecutionSchema);