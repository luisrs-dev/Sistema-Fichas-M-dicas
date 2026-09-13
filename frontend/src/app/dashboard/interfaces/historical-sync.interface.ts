export interface HistoricalSyncJob {
  _id: string;
  center: string;
  active: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  step: string;
  progress: number;
  error?: string;
  result?: { total: number; updated: string[]; alreadyHistorical: string[]; notFound: string[]; ambiguous: string[]; errors: string[] };
}
