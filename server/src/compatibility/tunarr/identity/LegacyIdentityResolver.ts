import type {
  ChannelForgeIdentityReference,
  LegacyIdentityMappingIdentifier,
  LegacyIdentityMappingRepository,
  LegacyIdentityMappingStatus,
  LegacyIdentityReference,
  LegacyIdentityTombstoneIdentifier,
  LegacyIdentityTombstoneReason,
  LegacyIdentityTombstoneRepository,
} from '@/modules/migration/index.js';

import type {
  CompatibilityErrorCode,
  CompatibilityMetricDimensions,
  CompatibilityMetricResult,
  CompatibilityMetrics,
  CompatibilityMode,
} from '../ports/index.js';

export const LegacyIdentityUnmappedReasons = [
  'NOT_FOUND',
  'MAPPING_NOT_VERIFIED',
  'MAPPING_INACTIVE',
] as const;

export type LegacyIdentityUnmappedReason =
  (typeof LegacyIdentityUnmappedReasons)[number];

export const LegacyIdentityResolutionErrorReasons = [
  'CONFLICT_RECORD_MISSING',
] as const;

export type LegacyIdentityResolutionErrorReason =
  (typeof LegacyIdentityResolutionErrorReasons)[number];

export type LegacyIdentityResolution =
  | Readonly<{
      kind: 'MAPPED';
      mappingId: LegacyIdentityMappingIdentifier;
      target: ChannelForgeIdentityReference;
    }>
  | Readonly<{
      kind: 'TOMBSTONED';
      tombstoneId: LegacyIdentityTombstoneIdentifier;
      reason: LegacyIdentityTombstoneReason;
      replacement?: ChannelForgeIdentityReference;
    }>
  | Readonly<{
      kind: 'CONFLICT';
      mappingId: LegacyIdentityMappingIdentifier;
      conflictId: string;
    }>
  | Readonly<{
      kind: 'UNMAPPED';
      reason: LegacyIdentityUnmappedReason;
      mappingId?: LegacyIdentityMappingIdentifier;
      mappingStatus?: LegacyIdentityMappingStatus;
    }>
  | Readonly<{
      kind: 'ERROR';
      code: CompatibilityErrorCode;
      reason: LegacyIdentityResolutionErrorReason;
      mappingId: LegacyIdentityMappingIdentifier;
    }>;

export type ResolveLegacyIdentityRequest = Readonly<{
  legacy: LegacyIdentityReference;

  concept: string;

  mode: CompatibilityMode;

  operation?: string;

  applicationVersion?: string;

  sourceSchemaVersion?: string;
}>;

function requireLabel(label: string, value: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RangeError(`${label} must not be empty`);
  }

  return normalized;
}

function requireOpaqueIdentifier(value: string): string {
  if (value.trim().length === 0) {
    throw new RangeError('legacy identifier must not be empty');
  }

  return value;
}

function mappingResult(
  status: LegacyIdentityMappingStatus,
): CompatibilityMetricResult {
  switch (status) {
    case 'VERIFIED':
      return 'SUCCESS';

    case 'CONFLICT':
      return 'CONFLICT';

    case 'PENDING':
    case 'MAPPED':
    case 'IGNORED':
    case 'SUPERSEDED':
    case 'ROLLED_BACK':
      return 'SKIPPED';
  }
}

export class LegacyIdentityResolver {
  constructor(
    private readonly mappingRepository: LegacyIdentityMappingRepository,

    private readonly tombstoneRepository: LegacyIdentityTombstoneRepository,

    private readonly metrics: CompatibilityMetrics,

    private readonly nowMilliseconds: () => number = () => Date.now(),
  ) {}

  resolve(request: ResolveLegacyIdentityRequest): LegacyIdentityResolution {
    const startedAt = this.nowMilliseconds();

    const legacy: LegacyIdentityReference = Object.freeze({
      namespace: requireLabel('legacy namespace', request.legacy.namespace),

      entityType: requireLabel('legacy entity type', request.legacy.entityType),

      identifier: requireOpaqueIdentifier(request.legacy.identifier),
    });

    const concept = requireLabel('compatibility concept', request.concept);

    const operation = requireLabel(
      'compatibility operation',
      request.operation ?? 'legacy-identity-resolve',
    );

    const dimensions = (
      result: CompatibilityMetricResult,
    ): CompatibilityMetricDimensions =>
      Object.freeze({
        concept,

        entityType: legacy.entityType,

        operation,

        mode: request.mode,

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

    const finish = (
      resolution: LegacyIdentityResolution,

      result: CompatibilityMetricResult,
    ): LegacyIdentityResolution => {
      this.metrics.observeMilliseconds(
        'COMPATIBILITY_LATENCY',

        Math.max(0, this.nowMilliseconds() - startedAt),

        dimensions(result),
      );

      return resolution;
    };

    const tombstone = this.tombstoneRepository.findByLegacyIdentity(legacy);

    this.metrics.increment(
      'TOMBSTONE_LOOKUPS',

      dimensions(tombstone === undefined ? 'NOT_FOUND' : 'TOMBSTONED'),
    );

    if (tombstone !== undefined) {
      this.metrics.increment(
        'TOMBSTONE_HITS',

        dimensions('TOMBSTONED'),
      );

      return finish(
        Object.freeze({
          kind: 'TOMBSTONED',

          tombstoneId: tombstone.tombstoneId,

          reason: tombstone.reason,

          ...(tombstone.replacement === undefined
            ? {}
            : {
                replacement: Object.freeze({
                  ...tombstone.replacement,
                }),
              }),
        }),

        'TOMBSTONED',
      );
    }

    const mapping = this.mappingRepository.findByLegacyIdentity(legacy);

    this.metrics.increment(
      'MAPPING_LOOKUPS',

      dimensions(
        mapping === undefined ? 'NOT_FOUND' : mappingResult(mapping.status),
      ),
    );

    if (mapping === undefined) {
      this.metrics.increment(
        'UNMAPPED_LEGACY_IDS',

        dimensions('NOT_FOUND'),
      );

      return finish(
        Object.freeze({
          kind: 'UNMAPPED',

          reason: 'NOT_FOUND',
        }),

        'NOT_FOUND',
      );
    }

    if (mapping.status === 'VERIFIED') {
      return finish(
        Object.freeze({
          kind: 'MAPPED',

          mappingId: mapping.mappingId,

          target: Object.freeze({
            ...mapping.channelForge,
          }),
        }),

        'SUCCESS',
      );
    }

    if (mapping.status === 'CONFLICT') {
      if (
        mapping.conflictId === undefined ||
        mapping.conflictId.trim().length === 0
      ) {
        this.metrics.increment(
          'COMPATIBILITY_ERRORS',

          dimensions('FAILURE'),
        );

        return finish(
          Object.freeze({
            kind: 'ERROR',

            code: 'COMPATIBILITY_CONFLICT',

            reason: 'CONFLICT_RECORD_MISSING',

            mappingId: mapping.mappingId,
          }),

          'FAILURE',
        );
      }

      this.metrics.increment(
        'MAPPING_CONFLICTS',

        dimensions('CONFLICT'),
      );

      return finish(
        Object.freeze({
          kind: 'CONFLICT',

          mappingId: mapping.mappingId,

          conflictId: mapping.conflictId,
        }),

        'CONFLICT',
      );
    }

    const reason: LegacyIdentityUnmappedReason =
      mapping.status === 'PENDING' || mapping.status === 'MAPPED'
        ? 'MAPPING_NOT_VERIFIED'
        : 'MAPPING_INACTIVE';

    this.metrics.increment(
      'UNMAPPED_LEGACY_IDS',

      dimensions('SKIPPED'),
    );

    return finish(
      Object.freeze({
        kind: 'UNMAPPED',

        reason,

        mappingId: mapping.mappingId,

        mappingStatus: mapping.status,
      }),

      'SKIPPED',
    );
  }
}
