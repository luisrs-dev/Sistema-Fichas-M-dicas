import { Schema, model } from 'mongoose';
const schema = new Schema({
  center: { type: String, required: true },
  requestedBy: { type: String, required: true },
  active: { type: Boolean, default: true },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  step: { type: String, default: 'Preparando sincronización' },
  progress: { type: Number, default: 0 },
  leaseUntil: { type: Date, required: true },
  completedAt: Date,
  error: String,
  result: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });
schema.index({ center: 1 }, { unique: true, partialFilterExpression: { active: true } });
export default model('HistoricalSyncJob', schema);
