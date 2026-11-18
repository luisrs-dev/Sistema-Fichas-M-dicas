import { Schema, model } from 'mongoose';
const schema = new Schema({
  slot: { type: String, default: 'monthly-attentions' },
  center: { type: String, required: true },
  month: Number, year: Number,
  patientIds: [String],
  active: { type: Boolean, default: true },
  status: { type: String, default: 'PENDING' },
  processed: { type: Number, default: 0 },
  batchSize: Number, pauseSeconds: Number,
  currentBatch: { type: Number, default: 0 },
  step: { type: String, default: 'En espera' },
  results: { type: [Schema.Types.Mixed], default: [] },
  error: String, completedAt: Date, heartbeatAt: Date,
  ownerHost: String, ownerPid: Number,
}, { timestamps: true });
// Un solo registro masivo en todo el VPS, tanto web como terminal.
schema.index({ slot: 1 }, { unique: true, partialFilterExpression: { active: true } });
export default model('AttentionBatchJob', schema);
