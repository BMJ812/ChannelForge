import type {
  CompatibilityErrorCode,
  CompatibilityErrorDescriptor,
} from '../ports/CompatibilityErrors.js';
import type {
  CompatibilityMetricDimensions,
  CompatibilityMetricResult,
  CompatibilityMetrics,
} from '../ports/CompatibilityMetrics.js';
import type { CompatibilityMode } from '../ports/CompatibilityMode.js';
import {
  tunarrLegacyJobRegistry,
  type LegacyJobClassification,
  type LegacyJobDescriptor,
  type LegacyJobRegistry,
} from './LegacyJobRegistry.js';

export const CompatibilityLegacyJobStatuses = [
  'STARTED',
  'SUCCEEDED',
  'FAILED',
  'SKIPPED',
] as const;

export type CompatibilityLegacyJobStatus =
  (typeof CompatibilityLegacyJobStatuses)[number];

export type CompatibilityLegacyJobStatusRecord = Readonly<{
  jobId: string;
  classifications: readonly LegacyJobClassification[];
  status: CompatibilityLegacyJobStatus;
}>;

export interface CompatibilityLegacyJobStatusRecorder {
  record(record: CompatibilityLegacyJobStatusRecord): void | Promise<void>;
}

type JobPolicyErrorCode = Exclude<
  CompatibilityErrorCode,
  'COMPATIBILITY_CONFLICT'
>;

export type CompatibilityLegacyJobExecutionDecision = Readonly<{
  allowed: boolean;
  errorCode?: JobPolicyErrorCode;
}>;

export interface CompatibilityLegacyJobExecutionPolicy {
  evaluate(job: LegacyJobDescriptor): CompatibilityLegacyJobExecutionDecision;
}

export type CompatibilityLegacyJobExecutionRequest<I, T, O> = Readonly<{
  jobId: string;
  input: I;
  mode?: CompatibilityMode;
  translateInput?: (input: I) => T;
  execute: (input: T, job: LegacyJobDescriptor) => O | Promise<O>;
}>;

export type CompatibilityLegacyJobExecutionResult<O> =
  | Readonly<{ outcome: 'SUCCESS'; job: LegacyJobDescriptor; value: O }>
  | Readonly<{
      outcome: 'SKIPPED' | 'FAILED';
      jobId: string;
      job?: LegacyJobDescriptor;
      error: CompatibilityErrorDescriptor;
    }>;

export type CompatibilityLegacyJobHandlerOptions = Readonly<{
  registry?: LegacyJobRegistry;
  metrics?: CompatibilityMetrics;
  statusRecorder?: CompatibilityLegacyJobStatusRecorder;
  executionPolicy?: CompatibilityLegacyJobExecutionPolicy;
}>;

const AllowAll: CompatibilityLegacyJobExecutionPolicy = Object.freeze({
  evaluate: () => Object.freeze({ allowed: true }),
});

function errorDescriptor(
  code: JobPolicyErrorCode,
  retryable: boolean,
): CompatibilityErrorDescriptor {
  if (code === 'LEGACY_WRITE_FROZEN') {
    return Object.freeze({ code, retryable: false });
  }
  return Object.freeze({ code, retryable });
}

export class CompatibilityLegacyJobHandler {
  private readonly registry: LegacyJobRegistry;
  private readonly metrics?: CompatibilityMetrics;
  private readonly statusRecorder?: CompatibilityLegacyJobStatusRecorder;
  private readonly executionPolicy: CompatibilityLegacyJobExecutionPolicy;

  constructor(options: CompatibilityLegacyJobHandlerOptions = {}) {
    this.registry = options.registry ?? tunarrLegacyJobRegistry;
    this.metrics = options.metrics;
    this.statusRecorder = options.statusRecorder;
    this.executionPolicy = options.executionPolicy ?? AllowAll;
  }

  async execute<I, T = I, O = void>(
    request: CompatibilityLegacyJobExecutionRequest<I, T, O>,
  ): Promise<CompatibilityLegacyJobExecutionResult<O>> {
    const mode = request.mode ?? 'LEGACY_ONLY';
    const job = this.registry.get(request.jobId);

    if (job === undefined) {
      this.metric('unknown-job', mode, 'NOT_FOUND');
      return Object.freeze({
        outcome: 'FAILED',
        jobId: request.jobId,
        error: errorDescriptor('COMPATIBILITY_UNAVAILABLE', false),
      });
    }

    const decision = this.decision(job);
    if (!decision.allowed) {
      await this.status(job, 'SKIPPED');
      this.metric(job.id, mode, 'SKIPPED');
      return Object.freeze({
        outcome: 'SKIPPED',
        jobId: job.id,
        job,
        error: errorDescriptor(
          decision.errorCode ?? 'COMPATIBILITY_UNAVAILABLE',
          false,
        ),
      });
    }

    await this.status(job, 'STARTED');

    let translated: T;
    try {
      translated =
        request.translateInput === undefined
          ? (request.input as unknown as T)
          : request.translateInput(request.input);
    } catch {
      await this.status(job, 'FAILED');
      this.metric(job.id, mode, 'FAILURE');
      return Object.freeze({
        outcome: 'FAILED',
        jobId: job.id,
        job,
        error: errorDescriptor('COMPATIBILITY_TRANSLATION_FAILED', false),
      });
    }

    try {
      const value = await request.execute(translated, job);
      await this.status(job, 'SUCCEEDED');
      this.metric(job.id, mode, 'SUCCESS');
      return Object.freeze({ outcome: 'SUCCESS', job, value });
    } catch {
      await this.status(job, 'FAILED');
      this.metric(job.id, mode, 'FAILURE');
      return Object.freeze({
        outcome: 'FAILED',
        jobId: job.id,
        job,
        error: errorDescriptor('COMPATIBILITY_UNAVAILABLE', true),
      });
    }
  }

  private decision(
    job: LegacyJobDescriptor,
  ): CompatibilityLegacyJobExecutionDecision {
    try {
      return this.executionPolicy.evaluate(job);
    } catch {
      return Object.freeze({
        allowed: false,
        errorCode: 'COMPATIBILITY_UNAVAILABLE',
      });
    }
  }

  private async status(
    job: LegacyJobDescriptor,
    status: CompatibilityLegacyJobStatus,
  ): Promise<void> {
    if (this.statusRecorder === undefined) return;
    try {
      await this.statusRecorder.record(
        Object.freeze({
          jobId: job.id,
          classifications: job.classifications,
          status,
        }),
      );
    } catch {
      // Observation cannot create a hidden execution authority.
    }
  }

  private metric(
    operation: string,
    mode: CompatibilityMode,
    result: CompatibilityMetricResult,
  ): void {
    if (this.metrics === undefined) return;

    const dimensions: CompatibilityMetricDimensions = {
      concept: 'legacy-job',
      entityType: 'job',
      operation,
      mode,
      result,
    };

    try {
      this.metrics.increment('LEGACY_JOB_EXECUTIONS', dimensions);
    } catch {
      // Metrics cannot change execution authority.
    }
  }
}
