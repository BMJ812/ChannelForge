import type { JobId, JobRequest } from '../domain/Job.js';

export interface JobDispatcher {
  enqueue(request: JobRequest): Promise<JobId>;
}
