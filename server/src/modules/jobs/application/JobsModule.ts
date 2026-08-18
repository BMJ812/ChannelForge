import type { JobId, JobRequest } from '../domain/Job.js';
import type { JobDispatcher } from '../ports/JobDispatcher.js';

export interface JobsCommandService {
  enqueue(request: JobRequest): Promise<JobId>;
}

export type JobsModuleDependencies = Readonly<{
  dispatcher: JobDispatcher;
}>;

export type JobsModule = Readonly<{
  commands: JobsCommandService;
}>;

class DefaultJobsCommandService implements JobsCommandService {
  constructor(private readonly dispatcher: JobDispatcher) {}

  enqueue(request: JobRequest): Promise<JobId> {
    return this.dispatcher.enqueue(request);
  }
}

export function createJobsModule(
  dependencies: JobsModuleDependencies,
): JobsModule {
  return Object.freeze({
    commands: new DefaultJobsCommandService(dependencies.dispatcher),
  });
}
