import { promises as fs } from "fs";
import path from "path";
import os from "os";

export type ExportJobStatus = "pending" | "processing" | "done" | "error";

export interface ExportJobEvent {
  type: "progress" | "done" | "error";
  current?: number;
  total?: number;
  patientName?: string;
  message?: string;
}

export interface ExportJob {
  id: string;
  status: ExportJobStatus;
  current: number;
  total: number;
  patientName: string;
  createdAt: Date;
  outputPath?: string;
  filename?: string;
  error?: string;
  // SSE subscribers: callbacks that receive events
  subscribers: Array<(event: ExportJobEvent) => void>;
}

const jobs = new Map<string, ExportJob>();

// Auto-cleanup jobs older than 30 minutes
const JOB_TTL_MS = 30 * 60 * 1000;

const cleanupOldJobs = () => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt.getTime() > JOB_TTL_MS) {
      // Remove temp file if it exists
      if (job.outputPath) {
        fs.unlink(job.outputPath).catch(() => {/* ignore */});
      }
      jobs.delete(id);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupOldJobs, 10 * 60 * 1000);

export const ExportJobStore = {
  create(id: string): ExportJob {
    const job: ExportJob = {
      id,
      status: "pending",
      current: 0,
      total: 0,
      patientName: "",
      createdAt: new Date(),
      subscribers: [],
    };
    jobs.set(id, job);
    return job;
  },

  get(id: string): ExportJob | undefined {
    return jobs.get(id);
  },

  update(id: string, updates: Partial<Omit<ExportJob, "id" | "subscribers" | "createdAt">>) {
    const job = jobs.get(id);
    if (!job) return;
    Object.assign(job, updates);
  },

  /**
   * Emits an SSE event to all subscribers of a job and updates job state.
   */
  emit(id: string, event: ExportJobEvent) {
    const job = jobs.get(id);
    if (!job) return;

    if (event.type === "progress") {
      if (event.current !== undefined) job.current = event.current;
      if (event.total !== undefined) job.total = event.total;
      if (event.patientName !== undefined) job.patientName = event.patientName;
    }
    if (event.type === "done") {
      job.status = "done";
    }
    if (event.type === "error") {
      job.status = "error";
      job.error = event.message;
    }

    for (const fn of job.subscribers) {
      try { fn(event); } catch { /* ignore closed connections */ }
    }
  },

  subscribe(id: string, fn: (event: ExportJobEvent) => void) {
    const job = jobs.get(id);
    if (!job) return;
    job.subscribers.push(fn);
  },

  unsubscribe(id: string, fn: (event: ExportJobEvent) => void) {
    const job = jobs.get(id);
    if (!job) return;
    job.subscribers = job.subscribers.filter((s) => s !== fn);
  },

  delete(id: string) {
    const job = jobs.get(id);
    if (job?.outputPath) {
      fs.unlink(job.outputPath).catch(() => {/* ignore */});
    }
    jobs.delete(id);
  },

  /** Returns the temp directory where export ZIPs are stored */
  getTempDir(): string {
    return path.join(os.tmpdir(), "ficlin-exports");
  },
};
