import mongoose, { Schema, model, models } from 'mongoose';

const TempChunkSchema = new Schema({
  uploadId: { type: String, required: true, index: true },
  chunkIndex: { type: Number, required: true },
  totalChunks: { type: Number, required: true },
  fileName: { type: String, required: false },
  fileType: { type: String, required: false },
  data: { type: Buffer, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // TTL index: auto-delete after 1 hour to prevent clutter
});

// Compound index for efficient chunk lookups
TempChunkSchema.index({ uploadId: 1, chunkIndex: 1 }, { unique: true });

// Prevent Mongoose OverwriteModelError
const TempChunk = models.TempChunk || model('TempChunk', TempChunkSchema);

export default TempChunk;
