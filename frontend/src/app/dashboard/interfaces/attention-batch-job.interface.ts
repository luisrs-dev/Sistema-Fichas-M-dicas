export interface AttentionBatchJob {
  _id: string;
  center: string;
  month: number;
  year: number;
  active: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED';
  patientIds: string[];
  processed: number;
  batchSize: number;
  currentBatch: number;
  step: string;
  error?: string;
  results: { patientId: string; status: 'success' | 'error' | 'warning'; message?: string }[];
}
