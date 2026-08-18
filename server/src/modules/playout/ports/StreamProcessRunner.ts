export type StreamProcessPlan = Readonly<{
  inputUri: string;
  outputFormat: string;
}>;

export type RunningStreamProcess = Readonly<{
  processId: string;
  stop(): Promise<void>;
}>;

export interface StreamProcessRunner {
  start(plan: StreamProcessPlan): Promise<RunningStreamProcess>;
}
