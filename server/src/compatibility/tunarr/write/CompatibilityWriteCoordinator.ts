import {
  CompatibilityStatusId,
  type CompatibilityErrorCode,
  type CompatibilityMetricDimensions,
  type CompatibilityMetricResult,
  type CompatibilityMetrics,
  type CompatibilityReconciliationEnqueuePort,
  type CompatibilityReconciliationReason,
  type CompatibilityStatusRecord,
  type CompatibilityStatusRepository,
  type CompatibilityWriteStatus,
} from '../ports/index.js';

export type CompatibilityWriteCommit = Readonly<{
  canonicalVersion?: string;
}>;

export type CompatibilityLegacyProjection = Readonly<{
  legacyVersion?: string;
}>;

export type CompatibilityWriteErrorDescriptor = Readonly<{
  errorCode: CompatibilityErrorCode;
  retryable: boolean;
}>;

export type CompatibilityWriteExecutionResult = Readonly<{
  status: CompatibilityWriteStatus;
  statusPersisted: boolean;
  authoritativeCommitted: boolean;
  compatibilityProjected: boolean;
  reconciliationEnqueued: boolean;
  reconciliationJobId?: string;
}>;

export type CompatibilityWriteRequest = Readonly<{
  conceptType: string;
  subjectKey: string;
  entityType?: string;
  channelForgeId?: string;
  legacyNamespace?: string;
  legacyId?: string;
  routeTemplate?: string;
  operation: string;
  correlationId?: string;
  applicationVersion?: string;
  sourceSchemaVersion?: string;

  commitAuthoritative(): Promise<CompatibilityWriteCommit>;

  projectLegacy(
    commit: CompatibilityWriteCommit,
  ): Promise<CompatibilityLegacyProjection>;

  describeAuthoritativeError?(
    error: unknown,
  ): CompatibilityWriteErrorDescriptor;

  describeProjectionError?(error: unknown): CompatibilityWriteErrorDescriptor;
}>;

export type CompatibilityWriteCoordinatorOptions = Readonly<{
  statuses: CompatibilityStatusRepository;
  reconciliation: CompatibilityReconciliationEnqueuePort;
  metrics: CompatibilityMetrics;
  now?: () => string;
  monotonicNow?: () => number;
}>;

const MODE = 'TEMPORARY_WRITE_TRANSLATION' as const;

function requireNonBlank(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new RangeError(`${field} must not be blank`);
  }
}

function describeError(
  mapper: ((error: unknown) => CompatibilityWriteErrorDescriptor) | undefined,
  error: unknown,
  fallbackCode: CompatibilityErrorCode,
  fallbackRetryable: boolean,
): CompatibilityWriteErrorDescriptor {
  return (
    mapper?.(error) ?? {
      errorCode: fallbackCode,
      retryable: fallbackRetryable,
    }
  );
}

function metricResult(
  status: CompatibilityWriteStatus,
): CompatibilityMetricResult {
  switch (status.state) {
    case 'CURRENT':
      return 'SUCCESS';
    case 'CONFLICT':
      return 'CONFLICT';
    case 'FROZEN':
      return 'FROZEN';
    case 'FAILED':
      return 'FAILURE';
    case 'DEGRADED':
    case 'PENDING':
      return 'DEGRADED';
    case 'RETIRED':
      return 'SKIPPED';
  }
}

export class CompatibilityWriteCoordinator {
  private readonly now: () => string;
  private readonly monotonicNow: () => number;

  constructor(private readonly options: CompatibilityWriteCoordinatorOptions) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.monotonicNow = options.monotonicNow ?? (() => performance.now());
  }

  async execute(
    request: CompatibilityWriteRequest,
  ): Promise<CompatibilityWriteExecutionResult> {
    requireNonBlank(request.conceptType, 'conceptType');
    requireNonBlank(request.subjectKey, 'subjectKey');
    requireNonBlank(request.operation, 'operation');

    const startedAt = this.monotonicNow();
    let outcome: CompatibilityMetricResult = 'FAILURE';

    try {
      const result = await this.executeInternal(request);
      outcome = metricResult(result.status);
      return result;
    } finally {
      this.options.metrics.observeMilliseconds(
        'COMPATIBILITY_LATENCY',
        Math.max(0, this.monotonicNow() - startedAt),
        this.dimensions(request, outcome),
      );
    }
  }

  private async executeInternal(
    request: CompatibilityWriteRequest,
  ): Promise<CompatibilityWriteExecutionResult> {
    const existing = this.options.statuses.findByScope({
      conceptType: request.conceptType,
      subjectKey: request.subjectKey,
    });

    const pending = this.nextRecord(
      request,
      existing,
      { state: 'PENDING' },
      {
        lastAttemptAt: this.now(),
        clearError: true,
        clearReconciliationJob: true,
      },
    );

    if (!this.persist(existing, pending)) {
      this.recordError(request, 'FAILURE');

      return {
        status: {
          state: 'FAILED',
          errorCode: 'COMPATIBILITY_UNAVAILABLE',
          retryable: true,
        },
        statusPersisted: false,
        authoritativeCommitted: false,
        compatibilityProjected: false,
        reconciliationEnqueued: false,
      };
    }

    let commit: CompatibilityWriteCommit;

    try {
      commit = await request.commitAuthoritative();
    } catch (error) {
      const descriptor = describeError(
        request.describeAuthoritativeError,
        error,
        'COMPATIBILITY_UNAVAILABLE',
        false,
      );

      const failed = this.nextRecord(
        request,
        pending,
        {
          state: 'FAILED',
          errorCode: descriptor.errorCode,
          retryable: descriptor.retryable,
        },
        {
          failureCount: pending.failureCount + 1,
          lastErrorCode: descriptor.errorCode,
          clearReconciliationJob: true,
        },
      );

      const persisted = this.persist(pending, failed);
      this.recordError(request, 'FAILURE');

      return {
        status: failed.status,
        statusPersisted: persisted,
        authoritativeCommitted: false,
        compatibilityProjected: false,
        reconciliationEnqueued: false,
      };
    }

    this.options.metrics.increment(
      'LEGACY_WRITE_ATTEMPTS',
      this.dimensions(request, 'SUCCESS'),
    );

    try {
      const projection = await request.projectLegacy(commit);

      this.options.metrics.increment(
        'TEMPORARY_TRANSLATION_SUCCESSES',
        this.dimensions(request, 'SUCCESS'),
      );

      const current = this.nextRecord(
        request,
        pending,
        { state: 'CURRENT' },
        {
          canonicalVersion: commit.canonicalVersion,
          legacyVersion: projection.legacyVersion,
          lastSuccessAt: this.now(),
          clearError: true,
          clearReconciliationJob: true,
        },
      );

      if (this.persist(pending, current)) {
        return {
          status: current.status,
          statusPersisted: true,
          authoritativeCommitted: true,
          compatibilityProjected: true,
          reconciliationEnqueued: false,
        };
      }

      this.recordError(request, 'DEGRADED');

      const reconciliation = await this.enqueueReconciliation(
        request,
        'STATUS_PERSISTENCE_FAILED',
        commit,
        projection,
        'COMPATIBILITY_UNAVAILABLE',
      );

      return {
        status: {
          state: 'DEGRADED',
          reconciliationRequired: true,
          errorCode: 'COMPATIBILITY_UNAVAILABLE',
        },
        statusPersisted: false,
        authoritativeCommitted: true,
        compatibilityProjected: true,
        reconciliationEnqueued: reconciliation.enqueued,
        ...(reconciliation.jobId === undefined
          ? {}
          : { reconciliationJobId: reconciliation.jobId }),
      };
    } catch (error) {
      const descriptor = describeError(
        request.describeProjectionError,
        error,
        'COMPATIBILITY_TRANSLATION_FAILED',
        true,
      );

      this.options.metrics.increment(
        'TEMPORARY_TRANSLATION_FAILURES',
        this.dimensions(request, 'DEGRADED'),
      );
      this.recordError(request, 'DEGRADED');

      const degraded = this.nextRecord(
        request,
        pending,
        {
          state: 'DEGRADED',
          reconciliationRequired: true,
          errorCode: descriptor.errorCode,
        },
        {
          canonicalVersion: commit.canonicalVersion,
          failureCount: pending.failureCount + 1,
          lastErrorCode: descriptor.errorCode,
          clearReconciliationJob: true,
        },
      );

      const degradedPersisted = this.persist(pending, degraded);

      const reconciliation = await this.enqueueReconciliation(
        request,
        'LEGACY_PROJECTION_FAILED',
        commit,
        undefined,
        descriptor.errorCode,
      );

      if (degradedPersisted && reconciliation.jobId !== undefined) {
        const linked = this.nextRecord(request, degraded, degraded.status, {
          reconciliationJobId: reconciliation.jobId,
        });

        this.persist(degraded, linked);
      }

      return {
        status: degraded.status,
        statusPersisted: degradedPersisted,
        authoritativeCommitted: true,
        compatibilityProjected: false,
        reconciliationEnqueued: reconciliation.enqueued,
        ...(reconciliation.jobId === undefined
          ? {}
          : { reconciliationJobId: reconciliation.jobId }),
      };
    }
  }

  private nextRecord(
    request: CompatibilityWriteRequest,
    previous: CompatibilityStatusRecord | undefined,
    status: CompatibilityWriteStatus,
    changes: Readonly<{
      canonicalVersion?: string;
      legacyVersion?: string;
      lastAttemptAt?: string;
      lastSuccessAt?: string;
      failureCount?: number;
      lastErrorCode?: CompatibilityErrorCode;
      reconciliationJobId?: string;
      clearError?: boolean;
      clearReconciliationJob?: boolean;
    }>,
  ): CompatibilityStatusRecord {
    const now = this.now();

    const canonicalVersion =
      changes.canonicalVersion ?? previous?.canonicalVersion;
    const legacyVersion = changes.legacyVersion ?? previous?.legacyVersion;
    const lastSuccessAt = changes.lastSuccessAt ?? previous?.lastSuccessAt;

    const lastErrorCode = changes.clearError
      ? undefined
      : (changes.lastErrorCode ?? previous?.lastErrorCode);

    const reconciliationJobId = changes.clearReconciliationJob
      ? undefined
      : (changes.reconciliationJobId ?? previous?.reconciliationJobId);

    return Object.freeze({
      statusId: previous?.statusId ?? CompatibilityStatusId.generate(),
      conceptType: request.conceptType,
      subjectKey: request.subjectKey,
      ...(request.channelForgeId === undefined
        ? {}
        : { channelForgeId: request.channelForgeId }),
      ...(request.legacyNamespace === undefined
        ? {}
        : { legacyNamespace: request.legacyNamespace }),
      ...(request.legacyId === undefined ? {} : { legacyId: request.legacyId }),
      mode: MODE,
      status,
      ...(canonicalVersion === undefined ? {} : { canonicalVersion }),
      ...(legacyVersion === undefined ? {} : { legacyVersion }),
      lastAttemptAt: changes.lastAttemptAt ?? previous?.lastAttemptAt ?? now,
      ...(lastSuccessAt === undefined ? {} : { lastSuccessAt }),
      failureCount: changes.failureCount ?? previous?.failureCount ?? 0,
      ...(lastErrorCode === undefined ? {} : { lastErrorCode }),
      ...(reconciliationJobId === undefined ? {} : { reconciliationJobId }),
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      version: previous === undefined ? 1 : previous.version + 1,
    });
  }

  private persist(
    previous: CompatibilityStatusRecord | undefined,
    next: CompatibilityStatusRecord,
  ): boolean {
    try {
      if (previous === undefined) {
        this.options.statuses.insert(next);
      } else {
        this.options.statuses.update(next, previous.version);
      }
      return true;
    } catch {
      return false;
    }
  }

  private async enqueueReconciliation(
    request: CompatibilityWriteRequest,
    reason: CompatibilityReconciliationReason,
    commit: CompatibilityWriteCommit,
    projection: CompatibilityLegacyProjection | undefined,
    errorCode: CompatibilityErrorCode,
  ): Promise<Readonly<{ enqueued: boolean; jobId?: string }>> {
    try {
      const result = await this.options.reconciliation.enqueue({
        conceptType: request.conceptType,
        subjectKey: request.subjectKey,
        reason,
        canonicalVersion: commit.canonicalVersion,
        legacyVersion: projection?.legacyVersion,
        errorCode,
        routeTemplate: request.routeTemplate,
        operation: request.operation,
        correlationId: request.correlationId,
      });

      if (result.queueDepth !== undefined) {
        this.options.metrics.setGauge(
          'RECONCILIATION_QUEUE_DEPTH',
          result.queueDepth,
          this.dimensions(request, 'DEGRADED'),
        );
      }

      return { enqueued: true, jobId: result.jobId };
    } catch {
      this.recordError(request, 'DEGRADED');
      return { enqueued: false };
    }
  }

  private recordError(
    request: CompatibilityWriteRequest,
    result: 'FAILURE' | 'DEGRADED',
  ): void {
    this.options.metrics.increment(
      'COMPATIBILITY_ERRORS',
      this.dimensions(request, result),
    );
  }

  private dimensions(
    request: CompatibilityWriteRequest,
    result: CompatibilityMetricResult,
  ): CompatibilityMetricDimensions {
    return Object.freeze({
      concept: request.conceptType,
      ...(request.entityType === undefined
        ? {}
        : { entityType: request.entityType }),
      ...(request.routeTemplate === undefined
        ? {}
        : { routeTemplate: request.routeTemplate }),
      operation: request.operation,
      mode: MODE,
      result,
      ...(request.applicationVersion === undefined
        ? {}
        : { applicationVersion: request.applicationVersion }),
      ...(request.sourceSchemaVersion === undefined
        ? {}
        : { sourceSchemaVersion: request.sourceSchemaVersion }),
    });
  }
}
