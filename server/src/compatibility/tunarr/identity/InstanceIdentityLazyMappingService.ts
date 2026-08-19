import { createHash } from 'node:crypto';

import type Database from 'better-sqlite3';

import { SqliteAuditSink } from '@/infrastructure/database/audit/SqliteAuditSink.js';
import {
  IdempotencyConflictError,
  SqliteIdempotencyStore,
} from '@/infrastructure/database/idempotency/SqliteIdempotencyStore.js';
import { SqliteInstanceRepository } from '@/infrastructure/database/repositories/SqliteInstanceRepository.js';
import { SqliteLegacyIdentityMappingRepository } from '@/infrastructure/database/repositories/SqliteLegacyIdentityMappingRepository.js';
import { SqliteLegacyIdentityTombstoneRepository } from '@/infrastructure/database/repositories/SqliteLegacyIdentityTombstoneRepository.js';
import { SqliteTransactionCoordinator } from '@/infrastructure/database/transactions/SqliteTransactionCoordinator.js';
import { InstanceId } from '@/modules/instance/index.js';
import {
  LegacyIdentityMappingConflictError,
  LegacyIdentityMappingService,
  type ChannelForgeIdentityReference,
  type LegacyIdentityMapping,
  type LegacyIdentityMappingIdentifier,
  type LegacyIdentityReference,
} from '@/modules/migration/index.js';

import type {
  CompatibilityMetricDimensions,
  CompatibilityMetrics,
} from '../ports/index.js';

export const InstanceIdentityLazyMappingPolicyIds = [
  'DISABLED',
  'JELLYFIN_LOGIN_INSTANCE_IDENTITY',
] as const;

export type InstanceIdentityLazyMappingPolicyId =
  (typeof InstanceIdentityLazyMappingPolicyIds)[number];

export const InstanceIdentityLazyMappingConflictReasons = [
  'TOMBSTONED',
  'LEGACY_ALREADY_MAPPED',
  'TARGET_ALREADY_MAPPED',
  'EXISTING_MAPPING_NOT_VERIFIED',
  'IDEMPOTENCY_KEY_REUSED',
  'IDEMPOTENCY_REPLAY_INCONSISTENT',
] as const;

export type InstanceIdentityLazyMappingConflictReason =
  (typeof InstanceIdentityLazyMappingConflictReasons)[number];

export const InstanceIdentityLazyMappingUnavailableReasons = [
  'POLICY_CONTEXT_MISMATCH',
  'SUPPORT_SCHEMA_UNAVAILABLE',
  'TARGET_INSTANCE_MISSING',
  'TARGET_INSTANCE_MISMATCH',
] as const;

export type InstanceIdentityLazyMappingUnavailableReason =
  (typeof InstanceIdentityLazyMappingUnavailableReasons)[number];

export type InstanceIdentityLazyMappingRequest = Readonly<{
  policyId: InstanceIdentityLazyMappingPolicyId;
  legacy: LegacyIdentityReference;
  target: ChannelForgeIdentityReference;
  operation: string;
  routeTemplate: string;
  applicationVersion: string;
  sourceSchemaVersion: string;
  correlationId?: string;
  now?: () => Date;
}>;

export type InstanceIdentityLazyMappingResult =
  | Readonly<{
      kind: 'DISABLED';
    }>
  | Readonly<{
      kind: 'CREATED';
      mappingId: LegacyIdentityMappingIdentifier;
    }>
  | Readonly<{
      kind: 'REUSED';
      mappingId: LegacyIdentityMappingIdentifier;
    }>
  | Readonly<{
      kind: 'CONFLICT';
      reason: InstanceIdentityLazyMappingConflictReason;
      existingMappingId?: LegacyIdentityMappingIdentifier;
    }>
  | Readonly<{
      kind: 'UNAVAILABLE';
      reason: InstanceIdentityLazyMappingUnavailableReason;
    }>
  | Readonly<{
      kind: 'FAILED';
      reason: 'UNEXPECTED_ERROR';
    }>;

const REQUIRED_SUPPORT_TABLES = [
  'cf_instance',
  'cf_legacy_identity_mapping',
  'cf_legacy_identity_tombstone',
  'cf_audit_record',
  'cf_idempotency_record',
] as const;

const IDEMPOTENCY_SCOPE = 'compatibility.lazy-mapping.instance-identity';

const IDEMPOTENCY_ACTOR = 'compatibility-runtime';

const COMPATIBILITY_PHASE = 'M04-04D';

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

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function sameLegacy(
  left: LegacyIdentityReference,
  right: LegacyIdentityReference,
): boolean {
  return (
    left.namespace === right.namespace &&
    left.entityType === right.entityType &&
    left.identifier === right.identifier
  );
}

function sameTarget(
  left: ChannelForgeIdentityReference,
  right: ChannelForgeIdentityReference,
): boolean {
  return (
    left.entityType === right.entityType && left.identifier === right.identifier
  );
}

function isVerifiedExactMapping(
  mapping: LegacyIdentityMapping,
  legacy: LegacyIdentityReference,
  target: ChannelForgeIdentityReference,
): boolean {
  return (
    mapping.status === 'VERIFIED' &&
    sameLegacy(mapping.legacy, legacy) &&
    sameTarget(mapping.channelForge, target)
  );
}

function supportSchemaIsAvailable(database: Database.Database): boolean {
  const placeholders = REQUIRED_SUPPORT_TABLES.map(() => '?').join(', ');

  const rows = database
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE
          type = 'table'
          AND name IN (
            ${placeholders}
          )
      `,
    )
    .all(...REQUIRED_SUPPORT_TABLES) as ReadonlyArray<{
    name: string;
  }>;

  const tables = new Set(rows.map((row) => row.name));

  return REQUIRED_SUPPORT_TABLES.every((table) => tables.has(table));
}

function policyContextMatches(
  request: InstanceIdentityLazyMappingRequest,
): boolean {
  return (
    request.policyId === 'JELLYFIN_LOGIN_INSTANCE_IDENTITY' &&
    request.operation === 'jellyfin-login-device-identity' &&
    request.routeTemplate === '/jellyfin/login' &&
    request.legacy.namespace === 'tunarr' &&
    request.legacy.entityType === 'instance' &&
    request.target.entityType === 'instance'
  );
}

export class InstanceIdentityLazyMappingService {
  constructor(
    private readonly database: Database.Database,

    private readonly metrics: CompatibilityMetrics,
  ) {}

  ensureVerifiedMapping(
    request: InstanceIdentityLazyMappingRequest,
  ): InstanceIdentityLazyMappingResult {
    if (request.policyId === 'DISABLED') {
      return Object.freeze({
        kind: 'DISABLED',
      });
    }

    const legacy: LegacyIdentityReference = Object.freeze({
      namespace: requireLabel('legacy namespace', request.legacy.namespace),

      entityType: requireLabel('legacy entity type', request.legacy.entityType),

      identifier: requireOpaqueIdentifier(request.legacy.identifier),
    });

    const target: ChannelForgeIdentityReference = Object.freeze({
      entityType: requireLabel(
        'ChannelForge entity type',
        request.target.entityType,
      ),

      identifier: requireLabel(
        'ChannelForge identifier',
        request.target.identifier,
      ),
    });

    const normalizedRequest: InstanceIdentityLazyMappingRequest = Object.freeze(
      {
        ...request,

        legacy,

        target,

        operation: requireLabel('compatibility operation', request.operation),

        routeTemplate: requireLabel(
          'compatibility route template',
          request.routeTemplate,
        ),

        applicationVersion: requireLabel(
          'application version',
          request.applicationVersion,
        ),

        sourceSchemaVersion: requireLabel(
          'source schema version',
          request.sourceSchemaVersion,
        ),
      },
    );

    const dimensions = (
      result: CompatibilityMetricDimensions['result'],
    ): CompatibilityMetricDimensions =>
      Object.freeze({
        concept: 'instance-identity',

        entityType: 'instance',

        routeTemplate: normalizedRequest.routeTemplate,

        operation: 'lazy-map-instance-identity',

        mode: 'CANONICAL_READ_LEGACY_FALLBACK',

        result,

        applicationVersion: normalizedRequest.applicationVersion,

        sourceSchemaVersion: normalizedRequest.sourceSchemaVersion,
      });

    const recordResult = (
      result: InstanceIdentityLazyMappingResult,
    ): InstanceIdentityLazyMappingResult => {
      switch (result.kind) {
        case 'CREATED':
          this.metrics.increment('MAPPING_CREATIONS', dimensions('SUCCESS'));

          this.metrics.increment('LAZY_MAPPINGS', dimensions('SUCCESS'));

          return result;

        case 'CONFLICT':
          this.metrics.increment('MAPPING_CONFLICTS', dimensions('CONFLICT'));

          return result;

        case 'FAILED':
          this.metrics.increment('COMPATIBILITY_ERRORS', dimensions('FAILURE'));

          return result;

        case 'DISABLED':
        case 'REUSED':
        case 'UNAVAILABLE':
          return result;
      }
    };

    if (!policyContextMatches(normalizedRequest)) {
      return recordResult(
        Object.freeze({
          kind: 'UNAVAILABLE',

          reason: 'POLICY_CONTEXT_MISMATCH',
        }),
      );
    }

    if (!supportSchemaIsAvailable(this.database)) {
      return recordResult(
        Object.freeze({
          kind: 'UNAVAILABLE',

          reason: 'SUPPORT_SCHEMA_UNAVAILABLE',
        }),
      );
    }

    const mappingRepository = new SqliteLegacyIdentityMappingRepository(
      this.database,
    );

    const tombstoneRepository = new SqliteLegacyIdentityTombstoneRepository(
      this.database,
    );

    const instanceRepository = new SqliteInstanceRepository(this.database);

    const audit = new SqliteAuditSink(this.database);

    const idempotency = new SqliteIdempotencyStore(this.database);

    const now = normalizedRequest.now ?? (() => new Date());

    const sourceKey = sha256(
      JSON.stringify({
        namespace: legacy.namespace,

        entityType: legacy.entityType,

        identifier: legacy.identifier,
      }),
    );

    const idempotencyKey = `instance:${sourceKey}`;

    const requestHash = sha256(
      JSON.stringify({
        policyId: normalizedRequest.policyId,

        compatibilityPhase: COMPATIBILITY_PHASE,

        legacy,

        target,

        operation: normalizedRequest.operation,

        routeTemplate: normalizedRequest.routeTemplate,

        applicationVersion: normalizedRequest.applicationVersion,

        sourceSchemaVersion: normalizedRequest.sourceSchemaVersion,
      }),
    );

    const appendConflictAudit = (
      reason: InstanceIdentityLazyMappingConflictReason,

      existingMappingId?: LegacyIdentityMappingIdentifier,
    ): void => {
      audit.append({
        actorType: 'COMPATIBILITY_RUNTIME',

        action: 'compatibility.lazy-map-instance-identity',

        targetType: 'legacy-identity-mapping',

        ...(existingMappingId === undefined
          ? {}
          : {
              targetId: existingMappingId,
            }),

        outcome: 'FAILURE',

        ...(normalizedRequest.correlationId === undefined
          ? {}
          : {
              correlationId: normalizedRequest.correlationId,
            }),

        details: Object.freeze({
          reason,

          policyId: normalizedRequest.policyId,

          compatibilityPhase: COMPATIBILITY_PHASE,

          sourceNamespace: legacy.namespace,

          sourceEntityType: legacy.entityType,

          targetEntityType: target.entityType,

          applicationVersion: normalizedRequest.applicationVersion,
        }),

        now,
      });
    };

    try {
      const result = new SqliteTransactionCoordinator(this.database).run(() => {
        const instance = instanceRepository.get();

        if (instance === undefined) {
          return Object.freeze({
            kind: 'UNAVAILABLE',

            reason: 'TARGET_INSTANCE_MISSING',
          }) satisfies InstanceIdentityLazyMappingResult;
        }

        const persistedTarget: ChannelForgeIdentityReference = Object.freeze({
          entityType: 'instance',

          identifier: InstanceId.toString(instance.instanceId),
        });

        if (!sameTarget(persistedTarget, target)) {
          return Object.freeze({
            kind: 'UNAVAILABLE',

            reason: 'TARGET_INSTANCE_MISMATCH',
          }) satisfies InstanceIdentityLazyMappingResult;
        }

        const tombstone = tombstoneRepository.findByLegacyIdentity(legacy);

        if (tombstone !== undefined) {
          appendConflictAudit('TOMBSTONED');

          return Object.freeze({
            kind: 'CONFLICT',

            reason: 'TOMBSTONED',
          }) satisfies InstanceIdentityLazyMappingResult;
        }

        const existingLegacy = mappingRepository.findByLegacyIdentity(legacy);

        if (existingLegacy !== undefined) {
          if (isVerifiedExactMapping(existingLegacy, legacy, target)) {
            return Object.freeze({
              kind: 'REUSED',

              mappingId: existingLegacy.mappingId,
            }) satisfies InstanceIdentityLazyMappingResult;
          }

          const reason: InstanceIdentityLazyMappingConflictReason = sameTarget(
            existingLegacy.channelForge,
            target,
          )
            ? 'EXISTING_MAPPING_NOT_VERIFIED'
            : 'LEGACY_ALREADY_MAPPED';

          appendConflictAudit(reason, existingLegacy.mappingId);

          return Object.freeze({
            kind: 'CONFLICT',

            reason,

            existingMappingId: existingLegacy.mappingId,
          }) satisfies InstanceIdentityLazyMappingResult;
        }

        const existingTarget =
          mappingRepository.findByChannelForgeIdentity(target);

        if (existingTarget !== undefined) {
          if (isVerifiedExactMapping(existingTarget, legacy, target)) {
            return Object.freeze({
              kind: 'REUSED',

              mappingId: existingTarget.mappingId,
            }) satisfies InstanceIdentityLazyMappingResult;
          }

          appendConflictAudit(
            'TARGET_ALREADY_MAPPED',
            existingTarget.mappingId,
          );

          return Object.freeze({
            kind: 'CONFLICT',

            reason: 'TARGET_ALREADY_MAPPED',

            existingMappingId: existingTarget.mappingId,
          }) satisfies InstanceIdentityLazyMappingResult;
        }

        let idempotencyBegin;

        try {
          idempotencyBegin = idempotency.begin({
            scope: IDEMPOTENCY_SCOPE,

            actorId: IDEMPOTENCY_ACTOR,

            idempotencyKey,

            requestHash,

            now,
          });
        } catch (error) {
          if (error instanceof IdempotencyConflictError) {
            appendConflictAudit('IDEMPOTENCY_KEY_REUSED');

            return Object.freeze({
              kind: 'CONFLICT',

              reason: 'IDEMPOTENCY_KEY_REUSED',
            }) satisfies InstanceIdentityLazyMappingResult;
          }

          throw error;
        }

        if (idempotencyBegin.kind === 'REPLAY') {
          const replayed = mappingRepository.findByLegacyIdentity(legacy);

          if (
            replayed !== undefined &&
            isVerifiedExactMapping(replayed, legacy, target)
          ) {
            return Object.freeze({
              kind: 'REUSED',

              mappingId: replayed.mappingId,
            }) satisfies InstanceIdentityLazyMappingResult;
          }

          appendConflictAudit(
            'IDEMPOTENCY_REPLAY_INCONSISTENT',
            replayed?.mappingId,
          );

          return Object.freeze({
            kind: 'CONFLICT',

            reason: 'IDEMPOTENCY_REPLAY_INCONSISTENT',

            ...(replayed === undefined
              ? {}
              : {
                  existingMappingId: replayed.mappingId,
                }),
          }) satisfies InstanceIdentityLazyMappingResult;
        }

        const mappingService = new LegacyIdentityMappingService(
          mappingRepository,
        );

        let mapping: LegacyIdentityMapping;

        try {
          mapping = mappingService.ensureOneToOneMapping({
            legacy,

            channelForge: target,

            metadata: Object.freeze({
              createdBy: 'compatibility-lazy-mapping',

              reason: normalizedRequest.policyId,

              compatibilityPhase: COMPATIBILITY_PHASE,

              applicationVersion: normalizedRequest.applicationVersion,
            }),

            now,
          });
        } catch (error) {
          if (error instanceof LegacyIdentityMappingConflictError) {
            const reason: InstanceIdentityLazyMappingConflictReason =
              error.reason === 'LEGACY_ALREADY_MAPPED'
                ? 'LEGACY_ALREADY_MAPPED'
                : 'TARGET_ALREADY_MAPPED';

            appendConflictAudit(reason, error.existing.mappingId);

            return Object.freeze({
              kind: 'CONFLICT',

              reason,

              existingMappingId: error.existing.mappingId,
            }) satisfies InstanceIdentityLazyMappingResult;
          }

          throw error;
        }

        const verified = mappingService.verifyMapping(mapping.mappingId, now);

        audit.append({
          actorType: 'COMPATIBILITY_RUNTIME',

          action: 'compatibility.lazy-map-instance-identity',

          targetType: 'legacy-identity-mapping',

          targetId: verified.mappingId,

          outcome: 'SUCCESS',

          ...(normalizedRequest.correlationId === undefined
            ? {}
            : {
                correlationId: normalizedRequest.correlationId,
              }),

          details: Object.freeze({
            reason: normalizedRequest.policyId,

            policyId: normalizedRequest.policyId,

            compatibilityPhase: COMPATIBILITY_PHASE,

            sourceNamespace: legacy.namespace,

            sourceEntityType: legacy.entityType,

            targetEntityType: target.entityType,

            applicationVersion: normalizedRequest.applicationVersion,

            mappingStatus: verified.status,
          }),

          now,
        });

        idempotency.complete(
          IDEMPOTENCY_SCOPE,
          IDEMPOTENCY_ACTOR,
          idempotencyKey,
          verified.mappingId,
          now,
        );

        return Object.freeze({
          kind: 'CREATED',

          mappingId: verified.mappingId,
        }) satisfies InstanceIdentityLazyMappingResult;
      });

      return recordResult(result);
    } catch {
      try {
        audit.append({
          actorType: 'COMPATIBILITY_RUNTIME',

          action: 'compatibility.lazy-map-instance-identity',

          targetType: 'legacy-identity-mapping',

          outcome: 'FAILURE',

          ...(normalizedRequest.correlationId === undefined
            ? {}
            : {
                correlationId: normalizedRequest.correlationId,
              }),

          details: Object.freeze({
            reason: 'UNEXPECTED_ERROR',

            policyId: normalizedRequest.policyId,

            compatibilityPhase: COMPATIBILITY_PHASE,

            sourceNamespace: legacy.namespace,

            sourceEntityType: legacy.entityType,

            targetEntityType: target.entityType,

            applicationVersion: normalizedRequest.applicationVersion,
          }),

          now,
        });
      } catch {
        // Failure auditing is best-effort only after the
        // transactional mutation has already rolled back.
      }

      return recordResult(
        Object.freeze({
          kind: 'FAILED',

          reason: 'UNEXPECTED_ERROR',
        }),
      );
    }
  }
}
