export interface ProxyUsageLog {
  _id?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  activity: string;
  sistratCenter?: string;
  patientId?: string;
  bytesDownloaded: number;
  megabytes: number;
  timestamp: Date;
}
