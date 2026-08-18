export type JobId = string;

export type JobRequest = Readonly<{
  jobType: string;
  correlationId?: string;
}>;

export type JobSummary = Readonly<{
  jobId: JobId;
  jobType: string;
  status: string;
}>;
