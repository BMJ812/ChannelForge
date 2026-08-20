import {
  CompatibilityReconciliationOutcomes,
  type CompatibilityErrorCode,
  type CompatibilityMetricDimensions,
  type CompatibilityMetricResult,
  type CompatibilityMetrics,
  type CompatibilityReconciliationBatchResult,
  type CompatibilityReconciliationJob,
  type CompatibilityReconciliationRepository,
  type CompatibilityReconciliationWorkerPort,
} from '../ports/index.js';

export type CompatibilityReconciliationWorkerErrorDescriptor = Readonly<{
  errorCode: CompatibilityErrorCode;
  retryable: boolean;
}>;

export type CompatibilityReconciliationRunDisposition =
  | 'CHECKPOINTED'
  | 'COMPLETED'
  | 'RETRY_QUEUED'
  | 'FAILED'
  | 'CANCELED';

export type CompatibilityReconciliationRunResult =
  | Readonly<{
      state: 'IDLE';
    }>
  | Readonly<{
      state: 'PROCESSED';
      jobId: CompatibilityReconciliationJob['jobId'];
      disposition: CompatibilityReconciliationRunDisposition;
      compared: number;
      findingCount: number;
    }>;

export type CompatibilityReconciliationRunnerOptions = Readonly<{
  repository: CompatibilityReconciliationRepository;
  worker: CompatibilityReconciliationWorkerPort;
  metrics: CompatibilityMetrics;
  batchSize?: number;
  maxAttempts?: number;
  now?: () => string;
  monotonicNow?: () => number;
  describeWorkerError?: (
    error: unknown,
  ) => CompatibilityReconciliationWorkerErrorDescriptor;
}>;

const MODE = 'TEMPORARY_WRITE_TRANSLATION' as const;
const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 500;
const DEFAULT_MAX_ATTEMPTS = 5;
const MAX_ATTEMPTS_LIMIT = 20;

class CompatibilityReconciliationBatchContractError extends Error {
  readonly name = 'CompatibilityReconciliationBatchContractError';
}

function positiveInteger(
  value: number,
  field: string,
  maximum: number,
): number {
  if (!Number.isInteger(value) || value <= 0 || value > maximum) {
    throw new RangeError(
      `${field} must be an integer between 1 and ${maximum}`,
    );
  }

  return value;
}

function countOutcome(
  result: CompatibilityReconciliationBatchResult,
  outcome: keyof CompatibilityReconciliationBatchResult['outcomeCounts'],
): number {
  return result.outcomeCounts[outcome] ?? 0;
}

function validateBatchResult(
  result: CompatibilityReconciliationBatchResult,
  batchSize: number,
): void {
  if (
    !Number.isInteger(result.compared) ||
    result.compared < 0 ||
    result.compared > batchSize
  ) {
    throw new CompatibilityReconciliationBatchContractError(
      `compared must be an integer between 0 and ${batchSize}`,
    );
  }

  if (result.findings.length > batchSize) {
    throw new CompatibilityReconciliationBatchContractError(
      `findings must not exceed batch size ${batchSize}`,
    );
  }

  let outcomeTotal = 0;

  for (const [key, value] of Object.entries(result.outcomeCounts)) {
    if (
      !CompatibilityReconciliationOutcomes.includes(
        key as (typeof CompatibilityReconciliationOutcomes)[number],
      )
    ) {
      throw new CompatibilityReconciliationBatchContractError(
        `unknown reconciliation outcome: ${key}`,
      );
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new CompatibilityReconciliationBatchContractError(
        `outcome count ${key} must be a non-negative integer`,
      );
    }

    outcomeTotal += value;
  }

  if (outcomeTotal !== result.compared) {
    throw new CompatibilityReconciliationBatchContractError(
      'outcome counts must sum exactly to compared',
    );
  }

  if (!result.complete) {
    if (result.compared === 0) {
      throw new CompatibilityReconciliationBatchContractError(
        'an incomplete batch must make forward progress',
      );
    }

    if (
      result.checkpoint === undefined ||
      result.checkpoint.trim().length === 0
    ) {
      throw new CompatibilityReconciliationBatchContractError(
        'an incomplete batch requires a non-blank checkpoint',
      );
    }
  }
}

function defaultWorkerError(
  error: unknown,
): CompatibilityReconciliationWorkerErrorDescriptor {
  if (error instanceof CompatibilityReconciliationBatchContractError) {
    return Object.freeze({
      errorCode: 'COMPATIBILITY_TRANSLATION_FAILED',
      retryable: false,
    });
  }

  return Object.freeze({
    errorCode: 'COMPATIBILITY_UNAVAILABLE',
    retryable: true,
  });
}

export class CompatibilityReconciliationRunner {
  private readonly batchSize: number;
  private readonly maxAttempts: number;
  private readonly now: () => string;
  private readonly monotonicNow: () => number;

  constructor(
    private readonly options: CompatibilityReconciliationRunnerOptions,
  ) {
    this.batchSize = positiveInteger(
      options.batchSize ?? DEFAULT_BATCH_SIZE,
      'batchSize',
      MAX_BATCH_SIZE,
    );

    this.maxAttempts = positiveInteger(
      options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      'maxAttempts',
      MAX_ATTEMPTS_LIMIT,
    );

    this.now = options.now ?? (() => new Date().toISOString());
    this.monotonicNow = options.monotonicNow ?? (() => performance.now());
  }

  recoverInterrupted(): number {
    return this.options.repository.recoverInterrupted(this.now());
  }

  async runNext(): Promise<CompatibilityReconciliationRunResult> {
    const job = this.options.repository.claimNext(this.now());

    if (job === undefined) {
      return Object.freeze({
        state: 'IDLE',
      });
    }

    const startedAt = this.monotonicNow();
    let metricResult: CompatibilityMetricResult = 'FAILURE';

    try {
      const batch = await this.options.worker.reconcileBatch({
        job,
        batchSize: this.batchSize,
      });

      validateBatchResult(batch, this.batchSize);

      const current = this.options.repository.getJob(job.jobId);

      if (current?.state === 'CANCELED') {
        metricResult = 'SKIPPED';
        this.refreshGauges(job, metricResult);

        return Object.freeze({
          state: 'PROCESSED',
          jobId: job.jobId,
          disposition: 'CANCELED',
          compared: 0,
          findingCount: 0,
        });
      }

      const observedAt = this.now();

      for (const finding of batch.findings) {
        this.options.repository.upsertFinding(job.jobId, finding, observedAt);
      }

      if (batch.complete) {
        this.options.repository.complete(job.jobId, batch.compared, observedAt);

        metricResult = 'SUCCESS';
      } else {
        this.options.repository.checkpoint(
          job.jobId,
          batch.checkpoint,
          batch.compared,
          observedAt,
        );

        metricResult = 'DEGRADED';
      }

      this.recordBatchMetrics(job, batch, metricResult);
      this.refreshGauges(job, metricResult);

      return Object.freeze({
        state: 'PROCESSED',
        jobId: job.jobId,
        disposition: batch.complete ? 'COMPLETED' : 'CHECKPOINTED',
        compared: batch.compared,
        findingCount: batch.findings.length,
      });
    } catch (error) {
      const descriptor =
        this.options.describeWorkerError?.(error) ?? defaultWorkerError(error);

      this.safeIncrement('COMPATIBILITY_ERRORS', job, 'FAILURE');

      if (descriptor.retryable && job.attemptCount < this.maxAttempts) {
        this.options.repository.retry(
          job.jobId,
          job.checkpoint,
          0,
          descriptor.errorCode,
          this.now(),
        );

        metricResult = 'DEGRADED';

        this.safeIncrement('RECONCILIATION_RETRIES', job, metricResult);

        this.refreshGauges(job, metricResult);

        return Object.freeze({
          state: 'PROCESSED',
          jobId: job.jobId,
          disposition: 'RETRY_QUEUED',
          compared: 0,
          findingCount: 0,
        });
      }

      this.options.repository.fail(job.jobId, descriptor.errorCode, this.now());

      metricResult = 'FAILURE';

      this.safeIncrement('RECONCILIATION_FAILED', job, metricResult);

      this.refreshGauges(job, metricResult);

      return Object.freeze({
        state: 'PROCESSED',
        jobId: job.jobId,
        disposition: 'FAILED',
        compared: 0,
        findingCount: 0,
      });
    } finally {
      this.safeObserveDuration(
        job,
        metricResult,
        Math.max(0, this.monotonicNow() - startedAt),
      );
    }
  }

  private recordBatchMetrics(
    job: CompatibilityReconciliationJob,
    batch: CompatibilityReconciliationBatchResult,
    result: CompatibilityMetricResult,
  ): void {
    if (batch.compared > 0) {
      this.safeIncrement(
        'RECONCILIATION_ITEMS_COMPARED',
        job,
        result,
        batch.compared,
      );
    }

    const equal = countOutcome(batch, 'EQUAL');

    if (equal > 0) {
      this.safeIncrement('RECONCILIATION_EQUAL', job, result, equal);
    }

    const repaired = countOutcome(batch, 'LEGACY_REPAIRED');

    if (repaired > 0) {
      this.safeIncrement('RECONCILIATION_REPAIRED', job, result, repaired);
    }

    const conflicts = countOutcome(batch, 'CONFLICT');

    if (conflicts > 0) {
      this.safeIncrement(
        'RECONCILIATION_CONFLICTS',
        job,
        'CONFLICT',
        conflicts,
      );
    }

    const retries = countOutcome(batch, 'RETRY');

    if (retries > 0) {
      this.safeIncrement('RECONCILIATION_RETRIES', job, 'DEGRADED', retries);
    }
  }

  private refreshGauges(
    job: CompatibilityReconciliationJob,
    result: CompatibilityMetricResult,
  ): void {
    try {
      const dimensions = this.dimensions(job, result);

      this.options.metrics.setGauge(
        'RECONCILIATION_QUEUE_DEPTH',
        this.options.repository.countQueued(),
        dimensions,
      );

      const oldest = this.options.repository.oldestOpenFindingAt();

      let ageSeconds = 0;

      if (oldest !== undefined) {
        const nowMilliseconds = Date.parse(this.now());
        const oldestMilliseconds = Date.parse(oldest);

        if (
          Number.isFinite(nowMilliseconds) &&
          Number.isFinite(oldestMilliseconds)
        ) {
          ageSeconds = Math.max(
            0,
            (nowMilliseconds - oldestMilliseconds) / 1000,
          );
        }
      }

      this.options.metrics.setGauge(
        'OLDEST_RECONCILIATION_FINDING_AGE_SECONDS',
        ageSeconds,
        dimensions,
      );
    } catch {
      // Observability must not change reconciliation authority or job state.
    }
  }

  private safeIncrement(
    metric:
      | 'COMPATIBILITY_ERRORS'
      | 'RECONCILIATION_ITEMS_COMPARED'
      | 'RECONCILIATION_EQUAL'
      | 'RECONCILIATION_REPAIRED'
      | 'RECONCILIATION_CONFLICTS'
      | 'RECONCILIATION_FAILED'
      | 'RECONCILIATION_RETRIES',
    job: CompatibilityReconciliationJob,
    result: CompatibilityMetricResult,
    amount = 1,
  ): void {
    try {
      this.options.metrics.increment(
        metric,
        this.dimensions(job, result),
        amount,
      );
    } catch {
      // Metrics are diagnostic only and must not change reconciliation state.
    }
  }

  private safeObserveDuration(
    job: CompatibilityReconciliationJob,
    result: CompatibilityMetricResult,
    milliseconds: number,
  ): void {
    try {
      this.options.metrics.observeMilliseconds(
        'RECONCILIATION_DURATION',
        milliseconds,
        this.dimensions(job, result),
      );
    } catch {
      // Metrics are diagnostic only and must not change reconciliation state.
    }
  }

  private dimensions(
    job: CompatibilityReconciliationJob,
    result: CompatibilityMetricResult,
  ): CompatibilityMetricDimensions {
    return Object.freeze({
      concept: job.conceptType,
      ...(job.routeTemplate === undefined
        ? {}
        : { routeTemplate: job.routeTemplate }),
      operation: job.operation,
      mode: MODE,
      result,
    });
  }
}
