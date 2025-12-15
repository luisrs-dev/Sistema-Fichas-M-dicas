export type BulkRecordStatus = "registered" | "skipped" | "error";

export interface BulkMonthlyRecordResult {
  patientId?: string;
  patientName: string;
  programName: string;
  status: BulkRecordStatus;
  reason?: string;
}

export interface BulkMonthlyProcessSummary {
  month: number;
  year: number;
  totalPatientsWithRecords: number;
  registered: number;
  skipped: number;
  errors: number;
  results: BulkMonthlyRecordResult[];
  logPath?: string;
  startedAt: string;
  finishedAt: string;
}
