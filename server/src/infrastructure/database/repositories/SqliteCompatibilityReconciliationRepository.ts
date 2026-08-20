import type Database from 'better-sqlite3';

import {
  CompatibilityReconciliationFindingId,
  CompatibilityReconciliationJobId,
  type CompatibilityReconciliationEnqueueResult,
  type CompatibilityReconciliationFinding,
  type CompatibilityReconciliationFindingDraft,
  type CompatibilityReconciliationJob,
  type CompatibilityReconciliationListJobsOptions,
  type CompatibilityReconciliationRepository,
  type CompatibilityReconciliationRequest,
} from '@/compatibility/tunarr/ports/index.js';

type ReconciliationJobRow = Readonly<{
  reconciliation_job_id: string;
  concept_type: string;
  subject_key: string;
  reason: CompatibilityReconciliationJob['reason'];
  canonical_version: string | null;
  legacy_version: string | null;
  error_code: CompatibilityReconciliationJob['errorCode'] | null;
  route_template: string | null;
  operation: string;
  correlation_id: string | null;
  state: CompatibilityReconciliationJob['state'];
  checkpoint: string | null;
  attempt_count: number;
  processed_count: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  last_error_code: CompatibilityReconciliationJob['lastErrorCode'] | null;
}>;

type ReconciliationFindingRow = Readonly<{
  reconciliation_finding_id: string;
  reconciliation_job_id: string;
  finding_key: string;
  concept_type: string;
  subject_key: string;
  channelforge_id: string | null;
  legacy_namespace: string | null;
  legacy_id: string | null;
  difference_code: string;
  severity: CompatibilityReconciliationFinding['severity'];
  outcome: CompatibilityReconciliationFinding['outcome'];
  repair_action: string | null;
  attempt_count: number;
  status: CompatibilityReconciliationFinding['status'];
  first_observed_at: string;
  last_observed_at: string;
  resolved_at: string | null;
}>;

const JOB_SELECT = `
  SELECT
    reconciliation_job_id,
    concept_type,
    subject_key,
    reason,
    canonical_version,
    legacy_version,
    error_code,
    route_template,
    operation,
    correlation_id,
    state,
    checkpoint,
    attempt_count,
    processed_count,
    created_at,
    updated_at,
    started_at,
    completed_at,
    last_error_code
  FROM cf_compatibility_reconciliation_job
`;

const FINDING_SELECT = `
  SELECT
    reconciliation_finding_id,
    reconciliation_job_id,
    finding_key,
    concept_type,
    subject_key,
    channelforge_id,
    legacy_namespace,
    legacy_id,
    difference_code,
    severity,
    outcome,
    repair_action,
    attempt_count,
    status,
    first_observed_at,
    last_observed_at,
    resolved_at
  FROM cf_compatibility_reconciliation_finding
`;

function requireNonBlank(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new RangeError(`${field} must not be blank`);
  }
}

function requireNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative integer`);
  }
}

function boundedLimit(value: number | undefined): number {
  if (value === undefined) {
    return 100;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError('limit must be a positive integer');
  }

  return Math.min(value, 1000);
}

function mapJob(row: ReconciliationJobRow): CompatibilityReconciliationJob {
  return Object.freeze({
    jobId: CompatibilityReconciliationJobId.parse(row.reconciliation_job_id),
    conceptType: row.concept_type,
    subjectKey: row.subject_key,
    reason: row.reason,
    ...(row.canonical_version === null
      ? {}
      : { canonicalVersion: row.canonical_version }),
    ...(row.legacy_version === null
      ? {}
      : { legacyVersion: row.legacy_version }),
    ...(row.error_code === null ? {} : { errorCode: row.error_code }),
    ...(row.route_template === null
      ? {}
      : { routeTemplate: row.route_template }),
    operation: row.operation,
    ...(row.correlation_id === null
      ? {}
      : { correlationId: row.correlation_id }),
    state: row.state,
    ...(row.checkpoint === null ? {} : { checkpoint: row.checkpoint }),
    attemptCount: row.attempt_count,
    processedCount: row.processed_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.started_at === null ? {} : { startedAt: row.started_at }),
    ...(row.completed_at === null ? {} : { completedAt: row.completed_at }),
    ...(row.last_error_code === null
      ? {}
      : { lastErrorCode: row.last_error_code }),
  });
}

function mapFinding(
  row: ReconciliationFindingRow,
): CompatibilityReconciliationFinding {
  const hasLegacy = row.legacy_namespace !== null && row.legacy_id !== null;

  if ((row.legacy_namespace === null) !== (row.legacy_id === null)) {
    throw new Error('Reconciliation finding legacy identity is incomplete');
  }

  return Object.freeze({
    findingId: CompatibilityReconciliationFindingId.parse(
      row.reconciliation_finding_id,
    ),
    jobId: CompatibilityReconciliationJobId.parse(row.reconciliation_job_id),
    findingKey: row.finding_key,
    conceptType: row.concept_type,
    subjectKey: row.subject_key,
    ...(row.channelforge_id === null
      ? {}
      : { channelForgeId: row.channelforge_id }),
    ...(hasLegacy
      ? {
          legacyNamespace: row.legacy_namespace!,
          legacyId: row.legacy_id!,
        }
      : {}),
    differenceCode: row.difference_code,
    severity: row.severity,
    outcome: row.outcome,
    ...(row.repair_action === null ? {} : { repairAction: row.repair_action }),
    attemptCount: row.attempt_count,
    status: row.status,
    firstObservedAt: row.first_observed_at,
    lastObservedAt: row.last_observed_at,
    ...(row.resolved_at === null ? {} : { resolvedAt: row.resolved_at }),
  });
}

export class SqliteCompatibilityReconciliationRepository
  implements CompatibilityReconciliationRepository
{
  private readonly now: () => string;

  constructor(
    private readonly database: Database.Database,
    now?: () => string,
  ) {
    this.now = now ?? (() => new Date().toISOString());
  }

  async enqueue(
    request: CompatibilityReconciliationRequest,
  ): Promise<CompatibilityReconciliationEnqueueResult> {
    requireNonBlank(request.conceptType, 'conceptType');
    requireNonBlank(request.subjectKey, 'subjectKey');
    requireNonBlank(request.operation, 'operation');

    const active = this.database
      .prepare(
        `
          ${JOB_SELECT}
          WHERE concept_type = ?
            AND subject_key = ?
            AND state IN ('QUEUED', 'RUNNING')
          ORDER BY created_at ASC, reconciliation_job_id ASC
          LIMIT 1
        `,
      )
      .get(request.conceptType, request.subjectKey) as
      | ReconciliationJobRow
      | undefined;

    if (active !== undefined) {
      return Object.freeze({
        jobId: CompatibilityReconciliationJobId.parse(
          active.reconciliation_job_id,
        ),
        queueDepth: this.countQueued(),
      });
    }

    const jobId = CompatibilityReconciliationJobId.generate();
    const at = this.now();

    this.database
      .prepare(
        `
          INSERT INTO cf_compatibility_reconciliation_job (
            reconciliation_job_id,
            concept_type,
            subject_key,
            reason,
            canonical_version,
            legacy_version,
            error_code,
            route_template,
            operation,
            correlation_id,
            state,
            checkpoint,
            attempt_count,
            processed_count,
            created_at,
            updated_at,
            started_at,
            completed_at,
            last_error_code
          )
          VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            'QUEUED', NULL, 0, 0, ?, ?, NULL, NULL, NULL
          )
        `,
      )
      .run(
        jobId,
        request.conceptType,
        request.subjectKey,
        request.reason,
        request.canonicalVersion ?? null,
        request.legacyVersion ?? null,
        request.errorCode ?? null,
        request.routeTemplate ?? null,
        request.operation,
        request.correlationId ?? null,
        at,
        at,
      );

    return Object.freeze({
      jobId,
      queueDepth: this.countQueued(),
    });
  }

  recoverInterrupted(at: string): number {
    requireNonBlank(at, 'at');

    const result = this.database
      .prepare(
        `
          UPDATE cf_compatibility_reconciliation_job
          SET
            state = 'QUEUED',
            started_at = NULL,
            updated_at = ?
          WHERE state = 'RUNNING'
        `,
      )
      .run(at);

    return result.changes;
  }

  claimNext(at: string): CompatibilityReconciliationJob | undefined {
    requireNonBlank(at, 'at');

    const claim = this.database.transaction(() => {
      const candidate = this.database
        .prepare(
          `
            SELECT reconciliation_job_id
            FROM cf_compatibility_reconciliation_job
            WHERE state = 'QUEUED'
            ORDER BY created_at ASC, reconciliation_job_id ASC
            LIMIT 1
          `,
        )
        .get() as { reconciliation_job_id: string } | undefined;

      if (candidate === undefined) {
        return undefined;
      }

      const result = this.database
        .prepare(
          `
            UPDATE cf_compatibility_reconciliation_job
            SET
              state = 'RUNNING',
              attempt_count = attempt_count + 1,
              started_at = ?,
              updated_at = ?
            WHERE reconciliation_job_id = ?
              AND state = 'QUEUED'
          `,
        )
        .run(at, at, candidate.reconciliation_job_id);

      if (result.changes !== 1) {
        return undefined;
      }

      return this.getJob(
        CompatibilityReconciliationJobId.parse(candidate.reconciliation_job_id),
      );
    });

    return claim();
  }

  checkpoint(
    jobId: CompatibilityReconciliationJobId,
    checkpoint: string | undefined,
    processedDelta: number,
    at: string,
  ): void {
    requireNonNegativeInteger(processedDelta, 'processedDelta');

    const result = this.database
      .prepare(
        `
          UPDATE cf_compatibility_reconciliation_job
          SET
            state = 'QUEUED',
            checkpoint = ?,
            processed_count = processed_count + ?,
            started_at = NULL,
            updated_at = ?
          WHERE reconciliation_job_id = ?
            AND state = 'RUNNING'
        `,
      )
      .run(checkpoint ?? null, processedDelta, at, jobId);

    if (result.changes !== 1) {
      throw new Error('Reconciliation checkpoint requires a RUNNING job');
    }
  }

  complete(
    jobId: CompatibilityReconciliationJobId,
    processedDelta: number,
    at: string,
  ): void {
    requireNonNegativeInteger(processedDelta, 'processedDelta');

    const result = this.database
      .prepare(
        `
          UPDATE cf_compatibility_reconciliation_job
          SET
            state = 'COMPLETED',
            processed_count = processed_count + ?,
            updated_at = ?,
            completed_at = ?,
            last_error_code = NULL
          WHERE reconciliation_job_id = ?
            AND state = 'RUNNING'
        `,
      )
      .run(processedDelta, at, at, jobId);

    if (result.changes !== 1) {
      throw new Error('Reconciliation completion requires a RUNNING job');
    }
  }

  retry(
    jobId: CompatibilityReconciliationJobId,
    checkpoint: string | undefined,
    processedDelta: number,
    errorCode: CompatibilityReconciliationJob['lastErrorCode'],
    at: string,
  ): void {
    requireNonNegativeInteger(processedDelta, 'processedDelta');

    if (errorCode === undefined) {
      throw new RangeError('errorCode is required for reconciliation retry');
    }

    const result = this.database
      .prepare(
        `
          UPDATE cf_compatibility_reconciliation_job
          SET
            state = 'QUEUED',
            checkpoint = ?,
            processed_count = processed_count + ?,
            started_at = NULL,
            updated_at = ?,
            last_error_code = ?
          WHERE reconciliation_job_id = ?
            AND state = 'RUNNING'
        `,
      )
      .run(checkpoint ?? null, processedDelta, at, errorCode, jobId);

    if (result.changes !== 1) {
      throw new Error('Reconciliation retry requires a RUNNING job');
    }
  }

  fail(
    jobId: CompatibilityReconciliationJobId,
    errorCode: CompatibilityReconciliationJob['lastErrorCode'],
    at: string,
  ): void {
    if (errorCode === undefined) {
      throw new RangeError('errorCode is required for reconciliation failure');
    }

    const result = this.database
      .prepare(
        `
          UPDATE cf_compatibility_reconciliation_job
          SET
            state = 'FAILED',
            updated_at = ?,
            completed_at = ?,
            last_error_code = ?
          WHERE reconciliation_job_id = ?
            AND state = 'RUNNING'
        `,
      )
      .run(at, at, errorCode, jobId);

    if (result.changes !== 1) {
      throw new Error('Reconciliation failure requires a RUNNING job');
    }
  }

  cancel(jobId: CompatibilityReconciliationJobId, at: string): void {
    const result = this.database
      .prepare(
        `
          UPDATE cf_compatibility_reconciliation_job
          SET
            state = 'CANCELED',
            updated_at = ?,
            completed_at = ?
          WHERE reconciliation_job_id = ?
            AND state IN ('QUEUED', 'RUNNING')
        `,
      )
      .run(at, at, jobId);

    if (result.changes !== 1) {
      throw new Error(
        'Only QUEUED or RUNNING reconciliation jobs can be canceled',
      );
    }
  }

  upsertFinding(
    jobId: CompatibilityReconciliationJobId,
    finding: CompatibilityReconciliationFindingDraft,
    at: string,
  ): CompatibilityReconciliationFinding {
    requireNonBlank(finding.findingKey, 'findingKey');
    requireNonBlank(finding.differenceCode, 'differenceCode');

    const job = this.getJob(jobId);

    if (job === undefined) {
      throw new Error('Cannot record finding for unknown reconciliation job');
    }

    const existing = this.database
      .prepare(
        `
          ${FINDING_SELECT}
          WHERE reconciliation_job_id = ?
            AND finding_key = ?
        `,
      )
      .get(jobId, finding.findingKey) as ReconciliationFindingRow | undefined;

    const resolvedAt = finding.status === 'RESOLVED' ? at : null;

    if (existing === undefined) {
      const findingId = CompatibilityReconciliationFindingId.generate();

      this.database
        .prepare(
          `
            INSERT INTO cf_compatibility_reconciliation_finding (
              reconciliation_finding_id,
              reconciliation_job_id,
              finding_key,
              concept_type,
              subject_key,
              channelforge_id,
              legacy_namespace,
              legacy_id,
              difference_code,
              severity,
              outcome,
              repair_action,
              attempt_count,
              status,
              first_observed_at,
              last_observed_at,
              resolved_at
            )
            VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?
            )
          `,
        )
        .run(
          findingId,
          jobId,
          finding.findingKey,
          job.conceptType,
          job.subjectKey,
          finding.channelForgeId ?? null,
          finding.legacyNamespace ?? null,
          finding.legacyId ?? null,
          finding.differenceCode,
          finding.severity,
          finding.outcome,
          finding.repairAction ?? null,
          finding.status,
          at,
          at,
          resolvedAt,
        );

      return this.getFinding(findingId)!;
    }

    this.database
      .prepare(
        `
          UPDATE cf_compatibility_reconciliation_finding
          SET
            channelforge_id = ?,
            legacy_namespace = ?,
            legacy_id = ?,
            difference_code = ?,
            severity = ?,
            outcome = ?,
            repair_action = ?,
            attempt_count = attempt_count + 1,
            status = ?,
            last_observed_at = ?,
            resolved_at = ?
          WHERE reconciliation_finding_id = ?
        `,
      )
      .run(
        finding.channelForgeId ?? null,
        finding.legacyNamespace ?? null,
        finding.legacyId ?? null,
        finding.differenceCode,
        finding.severity,
        finding.outcome,
        finding.repairAction ?? null,
        finding.status,
        at,
        resolvedAt,
        existing.reconciliation_finding_id,
      );

    return this.getFinding(
      CompatibilityReconciliationFindingId.parse(
        existing.reconciliation_finding_id,
      ),
    )!;
  }

  getJob(
    jobId: CompatibilityReconciliationJobId,
  ): CompatibilityReconciliationJob | undefined {
    const row = this.database
      .prepare(
        `
          ${JOB_SELECT}
          WHERE reconciliation_job_id = ?
        `,
      )
      .get(jobId) as ReconciliationJobRow | undefined;

    return row === undefined ? undefined : mapJob(row);
  }

  listJobs(
    options: CompatibilityReconciliationListJobsOptions = {},
  ): readonly CompatibilityReconciliationJob[] {
    const limit = boundedLimit(options.limit);

    const rows =
      options.state === undefined
        ? (this.database
            .prepare(
              `
                ${JOB_SELECT}
                ORDER BY created_at DESC, reconciliation_job_id DESC
                LIMIT ?
              `,
            )
            .all(limit) as ReconciliationJobRow[])
        : (this.database
            .prepare(
              `
                ${JOB_SELECT}
                WHERE state = ?
                ORDER BY created_at DESC, reconciliation_job_id DESC
                LIMIT ?
              `,
            )
            .all(options.state, limit) as ReconciliationJobRow[]);

    return Object.freeze(rows.map(mapJob));
  }

  listOpenFindings(
    limitValue = 100,
  ): readonly CompatibilityReconciliationFinding[] {
    const limit = boundedLimit(limitValue);

    const rows = this.database
      .prepare(
        `
          ${FINDING_SELECT}
          WHERE status = 'OPEN'
          ORDER BY
            CASE severity
              WHEN 'CRITICAL' THEN 1
              WHEN 'ERROR' THEN 2
              WHEN 'WARNING' THEN 3
              ELSE 4
            END,
            first_observed_at ASC,
            reconciliation_finding_id ASC
          LIMIT ?
        `,
      )
      .all(limit) as ReconciliationFindingRow[];

    return Object.freeze(rows.map(mapFinding));
  }

  countQueued(): number {
    const row = this.database
      .prepare(
        `
          SELECT COUNT(*) AS count
          FROM cf_compatibility_reconciliation_job
          WHERE state = 'QUEUED'
        `,
      )
      .get() as { count: number };

    return row.count;
  }

  oldestOpenFindingAt(): string | undefined {
    const row = this.database
      .prepare(
        `
          SELECT MIN(first_observed_at) AS oldest
          FROM cf_compatibility_reconciliation_finding
          WHERE status = 'OPEN'
        `,
      )
      .get() as { oldest: string | null };

    return row.oldest ?? undefined;
  }

  private getFinding(
    findingId: CompatibilityReconciliationFindingId,
  ): CompatibilityReconciliationFinding | undefined {
    const row = this.database
      .prepare(
        `
          ${FINDING_SELECT}
          WHERE reconciliation_finding_id = ?
        `,
      )
      .get(findingId) as ReconciliationFindingRow | undefined;

    return row === undefined ? undefined : mapFinding(row);
  }
}
