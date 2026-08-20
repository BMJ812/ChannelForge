import type {
  CompatibilityReconciliationFinding,
  CompatibilityReconciliationJob,
  CompatibilityReconciliationRepository,
} from '../ports/index.js';

export type CompatibilityReconciliationDiagnosticsOptions = Readonly<{
  jobLimit?: number;
  findingLimit?: number;
}>;

export type CompatibilityReconciliationDiagnosticsSnapshot = Readonly<{
  queueDepth: number;
  oldestOpenFindingAt?: string;
  oldestOpenFindingAgeSeconds?: number;
  recentJobs: readonly CompatibilityReconciliationJob[];
  openFindings: readonly CompatibilityReconciliationFinding[];
}>;

const DEFAULT_JOB_LIMIT = 50;
const DEFAULT_FINDING_LIMIT = 100;
const MAX_LIMIT = 1000;

function boundedLimit(
  value: number | undefined,
  fallback: number,
  field: string,
): number {
  const resolved = value ?? fallback;

  if (!Number.isInteger(resolved) || resolved <= 0 || resolved > MAX_LIMIT) {
    throw new RangeError(
      `${field} must be an integer between 1 and ${MAX_LIMIT}`,
    );
  }

  return resolved;
}

export class CompatibilityReconciliationDiagnostics {
  private readonly now: () => string;

  constructor(
    private readonly repository: CompatibilityReconciliationRepository,
    now?: () => string,
  ) {
    this.now = now ?? (() => new Date().toISOString());
  }

  snapshot(
    options: CompatibilityReconciliationDiagnosticsOptions = {},
  ): CompatibilityReconciliationDiagnosticsSnapshot {
    const jobLimit = boundedLimit(
      options.jobLimit,
      DEFAULT_JOB_LIMIT,
      'jobLimit',
    );

    const findingLimit = boundedLimit(
      options.findingLimit,
      DEFAULT_FINDING_LIMIT,
      'findingLimit',
    );

    const oldestOpenFindingAt = this.repository.oldestOpenFindingAt();

    let oldestOpenFindingAgeSeconds: number | undefined;

    if (oldestOpenFindingAt !== undefined) {
      const nowMilliseconds = Date.parse(this.now());
      const oldestMilliseconds = Date.parse(oldestOpenFindingAt);

      if (
        Number.isFinite(nowMilliseconds) &&
        Number.isFinite(oldestMilliseconds)
      ) {
        oldestOpenFindingAgeSeconds = Math.max(
          0,
          (nowMilliseconds - oldestMilliseconds) / 1000,
        );
      }
    }

    return Object.freeze({
      queueDepth: this.repository.countQueued(),
      ...(oldestOpenFindingAt === undefined ? {} : { oldestOpenFindingAt }),
      ...(oldestOpenFindingAgeSeconds === undefined
        ? {}
        : { oldestOpenFindingAgeSeconds }),
      recentJobs: this.repository.listJobs({
        limit: jobLimit,
      }),
      openFindings: this.repository.listOpenFindings(findingLimit),
    });
  }
}
