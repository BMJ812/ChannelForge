import { createHash } from 'node:crypto';

import type {
  CompatibilityMetricDimensions,
  CompatibilityMetrics,
} from '../ports/index.js';

export const ShadowReadAuthorities = ['LEGACY', 'CANONICAL'] as const;

export type ShadowReadAuthority = (typeof ShadowReadAuthorities)[number];

export const ShadowReadDifferenceClasses = [
  'EQUAL',
  'EXPECTED_FORMATTING_DIFFERENCE',
  'EXPECTED_SEMANTIC_DIFFERENCE',
  'LEGACY_MISSING',
  'CANONICAL_MISSING',
  'IDENTITY_MISMATCH',
  'VALUE_MISMATCH',
  'ORDER_MISMATCH',
  'ERROR_MISMATCH',
  'UNKNOWN',
] as const;

export type ShadowReadDifferenceClass =
  (typeof ShadowReadDifferenceClasses)[number];

export const ShadowReadSeverities = [
  'INFO',
  'WARNING',
  'ERROR',
  'CRITICAL',
] as const;

export type ShadowReadSeverity = (typeof ShadowReadSeverities)[number];

export const ShadowReadSkipReasons = [
  'DISABLED',
  'SAMPLED_OUT',
  'ABORTED',
] as const;

export type ShadowReadSkipReason = (typeof ShadowReadSkipReasons)[number];

export type ShadowReadObservation<T> =
  | Readonly<{
      kind: 'VALUE';
      value: T;
    }>
  | Readonly<{
      kind: 'MISSING';
    }>
  | Readonly<{
      kind: 'ERROR';
      errorCode: string;
    }>;

export type ShadowReadSamplingPolicy = Readonly<{
  enabled: boolean;
  sampleRate: number;
  criticalIdentity?: boolean;
  samplingKey?: string;
}>;

export type ShadowReadFinding = Readonly<{
  concept: string;
  authority: ShadowReadAuthority;
  legacyChecksum: string | null;
  canonicalChecksum: string | null;
  differenceClass: ShadowReadDifferenceClass;
  operation: string;
  routeTemplate?: string;
  timestamp: string;
  correlationId?: string;
  severity: ShadowReadSeverity;
}>;

export interface ShadowReadDiagnosticSink {
  record(finding: ShadowReadFinding): void;
}

export type ShadowReadValueDifferenceClassifier<T> = (
  legacyValue: T,
  canonicalValue: T,
) => ShadowReadDifferenceClass;

export type ShadowReadRequest<T> = Readonly<{
  concept: string;
  entityType?: string;
  authority: ShadowReadAuthority;
  legacy: ShadowReadObservation<T>;
  canonical: ShadowReadObservation<T>;
  operation: string;
  routeTemplate?: string;
  correlationId?: string;
  applicationVersion?: string;
  sourceSchemaVersion?: string;
  sampling?: ShadowReadSamplingPolicy;
  signal?: AbortSignal;
  maxSerializedBytes?: number;
  classifyValueDifference?: ShadowReadValueDifferenceClassifier<T>;
}>;

export type ShadowReadExecution<T> =
  | Readonly<{
      status: 'COMPARED';
      authority: ShadowReadAuthority;
      authoritativeObservation: ShadowReadObservation<T>;
      finding: ShadowReadFinding;
    }>
  | Readonly<{
      status: 'SKIPPED';
      authority: ShadowReadAuthority;
      authoritativeObservation: ShadowReadObservation<T>;
      reason: ShadowReadSkipReason;
    }>;

const DEFAULT_MAX_SERIALIZED_BYTES = 64 * 1024;
const MAX_ALLOWED_SERIALIZED_BYTES = 1024 * 1024;

function requireLabel(label: string, value: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RangeError(`${label} must not be empty`);
  }

  return normalized;
}

function requireErrorCode(value: string): string {
  return requireLabel('shadow error code', value);
}

function stableJson(value: unknown): string {
  const seen = new WeakSet<object>();

  const normalize = (input: unknown): unknown => {
    if (
      input === null ||
      typeof input === 'string' ||
      typeof input === 'boolean'
    ) {
      return input;
    }

    if (typeof input === 'number') {
      if (!Number.isFinite(input)) {
        throw new TypeError(
          'Shadow values must not contain non-finite numbers',
        );
      }

      return input;
    }

    if (typeof input === 'bigint') {
      return Object.freeze({
        $bigint: input.toString(),
      });
    }

    if (Array.isArray(input)) {
      return input.map((entry) => normalize(entry));
    }

    if (typeof input === 'object') {
      if (seen.has(input)) {
        throw new TypeError(
          'Shadow values must not contain circular references',
        );
      }

      seen.add(input);

      try {
        const entries = Object.entries(
          input as Readonly<Record<string, unknown>>,
        )
          .filter(([, entry]) => entry !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, entry]) => [key, normalize(entry)] as const);

        return Object.freeze(Object.fromEntries(entries));
      } finally {
        seen.delete(input);
      }
    }

    throw new TypeError(`Unsupported shadow value type: ${typeof input}`);
  };

  return JSON.stringify(normalize(value));
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function isDifferenceClass(value: string): value is ShadowReadDifferenceClass {
  return (ShadowReadDifferenceClasses as readonly string[]).includes(value);
}

function severityFor(
  differenceClass: ShadowReadDifferenceClass,
): ShadowReadSeverity {
  switch (differenceClass) {
    case 'EQUAL':
    case 'EXPECTED_FORMATTING_DIFFERENCE':
      return 'INFO';

    case 'EXPECTED_SEMANTIC_DIFFERENCE':
    case 'LEGACY_MISSING':
    case 'CANONICAL_MISSING':
      return 'WARNING';

    case 'VALUE_MISMATCH':
    case 'ORDER_MISMATCH':
    case 'ERROR_MISMATCH':
    case 'UNKNOWN':
      return 'ERROR';

    case 'IDENTITY_MISMATCH':
      return 'CRITICAL';
  }
}

function metricResultFor(
  differenceClass: ShadowReadDifferenceClass,
): CompatibilityMetricDimensions['result'] {
  switch (differenceClass) {
    case 'EQUAL':
      return 'SUCCESS';

    case 'EXPECTED_FORMATTING_DIFFERENCE':
    case 'EXPECTED_SEMANTIC_DIFFERENCE':
      return 'DEGRADED';

    case 'LEGACY_MISSING':
    case 'CANONICAL_MISSING':
      return 'NOT_FOUND';

    case 'IDENTITY_MISMATCH':
    case 'VALUE_MISMATCH':
    case 'ORDER_MISMATCH':
    case 'ERROR_MISMATCH':
    case 'UNKNOWN':
      return 'FAILURE';
  }
}

function authoritativeObservation<T>(
  request: ShadowReadRequest<T>,
): ShadowReadObservation<T> {
  return request.authority === 'CANONICAL' ? request.canonical : request.legacy;
}

function validateSampleRate(sampleRate: number): number {
  if (!Number.isFinite(sampleRate) || sampleRate < 0 || sampleRate > 1) {
    throw new RangeError('Shadow sampleRate must be between 0 and 1');
  }

  return sampleRate;
}

function sampledIn<T>(
  request: ShadowReadRequest<T>,
  sampling: ShadowReadSamplingPolicy,
): boolean {
  const sampleRate = validateSampleRate(sampling.sampleRate);

  if (sampling.criticalIdentity === true && sampleRate < 1) {
    throw new RangeError(
      'Critical identity shadow validation must not be sampled',
    );
  }

  if (sampleRate === 1) {
    return true;
  }

  if (sampleRate === 0) {
    return false;
  }

  const samplingKey = sampling.samplingKey ?? request.correlationId;

  if (samplingKey === undefined || samplingKey.trim().length === 0) {
    throw new RangeError(
      'Partial shadow sampling requires a stable samplingKey or correlationId',
    );
  }

  const digest = createHash('sha256')
    .update([request.concept, request.operation, samplingKey].join('\u001f'))
    .digest();

  const bucket = digest.readUInt32BE(0) / 0x1_0000_0000;

  return bucket < sampleRate;
}

function isAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

function checksumObservation<T>(
  observation: ShadowReadObservation<T>,
  maxSerializedBytes: number,
): Readonly<{
  checksum: string | null;
  serialized?: string;
  oversized?: boolean;
  serializationFailed?: boolean;
}> {
  switch (observation.kind) {
    case 'MISSING':
      return Object.freeze({
        checksum: null,
      });

    case 'ERROR': {
      const errorCode = requireErrorCode(observation.errorCode);

      return Object.freeze({
        checksum: sha256(`ERROR:${errorCode}`),
      });
    }

    case 'VALUE':
      try {
        const serialized = stableJson(observation.value);
        const bytes = Buffer.byteLength(serialized, 'utf8');

        return Object.freeze({
          checksum: sha256(serialized),
          ...(bytes > maxSerializedBytes
            ? {
                oversized: true,
              }
            : {
                serialized,
              }),
        });
      } catch {
        return Object.freeze({
          checksum: null,
          serializationFailed: true,
        });
      }
  }
}

function classifyAutomatic<T>(
  legacy: ShadowReadObservation<T>,
  canonical: ShadowReadObservation<T>,
  legacyChecksum: ReturnType<typeof checksumObservation<T>>,
  canonicalChecksum: ReturnType<typeof checksumObservation<T>>,
  classifyValueDifference: ShadowReadValueDifferenceClassifier<T> | undefined,
): ShadowReadDifferenceClass {
  if (
    legacyChecksum.serializationFailed === true ||
    canonicalChecksum.serializationFailed === true ||
    legacyChecksum.oversized === true ||
    canonicalChecksum.oversized === true
  ) {
    return 'UNKNOWN';
  }

  if (legacy.kind === 'MISSING' && canonical.kind === 'MISSING') {
    return 'EQUAL';
  }

  if (legacy.kind === 'MISSING') {
    return 'LEGACY_MISSING';
  }

  if (canonical.kind === 'MISSING') {
    return 'CANONICAL_MISSING';
  }

  if (legacy.kind === 'ERROR' || canonical.kind === 'ERROR') {
    if (
      legacy.kind === 'ERROR' &&
      canonical.kind === 'ERROR' &&
      requireErrorCode(legacy.errorCode) ===
        requireErrorCode(canonical.errorCode)
    ) {
      return 'EQUAL';
    }

    return 'ERROR_MISMATCH';
  }

  if (
    legacyChecksum.checksum !== null &&
    legacyChecksum.checksum === canonicalChecksum.checksum
  ) {
    return 'EQUAL';
  }

  if (classifyValueDifference === undefined) {
    return 'VALUE_MISMATCH';
  }

  const classified = classifyValueDifference(legacy.value, canonical.value);

  if (!isDifferenceClass(classified) || classified === 'EQUAL') {
    throw new RangeError(
      'Value-difference classifier must return a non-EQUAL ShadowReadDifferenceClass',
    );
  }

  return classified;
}

export class ShadowReadFramework {
  constructor(
    private readonly metrics: CompatibilityMetrics,
    private readonly diagnostics?: ShadowReadDiagnosticSink,
    private readonly now: () => Date = () => new Date(),
    private readonly monotonicNow: () => number = () => performance.now(),
  ) {}

  compare<T>(request: ShadowReadRequest<T>): ShadowReadExecution<T> {
    const startedAt = this.monotonicNow();

    const concept = requireLabel('shadow concept', request.concept);
    const operation = requireLabel('shadow operation', request.operation);
    const entityType =
      request.entityType === undefined
        ? undefined
        : requireLabel('shadow entity type', request.entityType);
    const routeTemplate =
      request.routeTemplate === undefined
        ? undefined
        : requireLabel('shadow route template', request.routeTemplate);

    const dimensions = (
      result: CompatibilityMetricDimensions['result'],
    ): CompatibilityMetricDimensions =>
      Object.freeze({
        concept,
        ...(entityType === undefined ? {} : { entityType }),
        ...(routeTemplate === undefined ? {} : { routeTemplate }),
        operation,
        mode: 'DUAL_COMPARE',
        result,
        ...(request.applicationVersion === undefined
          ? {}
          : {
              applicationVersion: request.applicationVersion,
            }),
        ...(request.sourceSchemaVersion === undefined
          ? {}
          : {
              sourceSchemaVersion: request.sourceSchemaVersion,
            }),
      });

    const authoritative = authoritativeObservation(request);

    const finishSkipped = (
      reason: ShadowReadSkipReason,
    ): ShadowReadExecution<T> => {
      this.metrics.increment('SHADOW_COMPARISONS', dimensions('SKIPPED'));

      this.metrics.observeMilliseconds(
        'COMPATIBILITY_LATENCY',
        Math.max(0, this.monotonicNow() - startedAt),
        dimensions('SKIPPED'),
      );

      return Object.freeze({
        status: 'SKIPPED',
        authority: request.authority,
        authoritativeObservation: authoritative,
        reason,
      });
    };

    if (isAborted(request.signal)) {
      return finishSkipped('ABORTED');
    }

    const sampling =
      request.sampling ??
      Object.freeze({
        enabled: true,
        sampleRate: 1,
      });

    if (!sampling.enabled) {
      return finishSkipped('DISABLED');
    }

    if (!sampledIn(request, sampling)) {
      return finishSkipped('SAMPLED_OUT');
    }

    const maxSerializedBytes =
      request.maxSerializedBytes ?? DEFAULT_MAX_SERIALIZED_BYTES;

    if (
      !Number.isInteger(maxSerializedBytes) ||
      maxSerializedBytes <= 0 ||
      maxSerializedBytes > MAX_ALLOWED_SERIALIZED_BYTES
    ) {
      throw new RangeError(
        `maxSerializedBytes must be an integer between 1 and ${MAX_ALLOWED_SERIALIZED_BYTES}`,
      );
    }

    const legacyChecksum = checksumObservation(
      request.legacy,
      maxSerializedBytes,
    );
    const canonicalChecksum = checksumObservation(
      request.canonical,
      maxSerializedBytes,
    );

    const differenceClass = classifyAutomatic(
      request.legacy,
      request.canonical,
      legacyChecksum,
      canonicalChecksum,
      request.classifyValueDifference,
    );

    if (isAborted(request.signal)) {
      return finishSkipped('ABORTED');
    }

    const result = metricResultFor(differenceClass);

    this.metrics.increment('SHADOW_COMPARISONS', dimensions(result));

    if (differenceClass !== 'EQUAL') {
      this.metrics.increment('SHADOW_MISMATCHES', dimensions(result));
    }

    this.metrics.observeMilliseconds(
      'COMPATIBILITY_LATENCY',
      Math.max(0, this.monotonicNow() - startedAt),
      dimensions(result),
    );

    const finding: ShadowReadFinding = Object.freeze({
      concept,
      authority: request.authority,
      legacyChecksum: legacyChecksum.checksum,
      canonicalChecksum: canonicalChecksum.checksum,
      differenceClass,
      operation,
      ...(routeTemplate === undefined ? {} : { routeTemplate }),
      timestamp: this.now().toISOString(),
      ...(request.correlationId === undefined
        ? {}
        : {
            correlationId: request.correlationId,
          }),
      severity: severityFor(differenceClass),
    });

    this.diagnostics?.record(finding);

    return Object.freeze({
      status: 'COMPARED',
      authority: request.authority,
      authoritativeObservation: authoritative,
      finding,
    });
  }
}
