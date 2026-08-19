import {
  LegacyIdentityMappingId,
  type ChannelForgeIdentityReference,
  type LegacyIdentityMapping,
  type LegacyIdentityReference,
} from '../domain/LegacyIdentityMapping.js';
import { MigrationConflictId } from '../domain/MigrationConflict.js';
import type { MigrationConflictRepository } from '../ports/MigrationConflictRepository.js';
import type { LegacyIdentityMappingRepository } from '../ports/LegacyIdentityMappingRepository.js';

export type LegacyIdentityConflictReason =
  | 'LEGACY_ALREADY_MAPPED'
  | 'TARGET_ALREADY_MAPPED';

export class LegacyIdentityMappingConflictError extends Error {
  constructor(
    readonly reason: LegacyIdentityConflictReason,
    readonly existing: LegacyIdentityMapping,
    readonly conflictId?: MigrationConflictId,
  ) {
    super(
      reason === 'LEGACY_ALREADY_MAPPED'
        ? 'Legacy identity is already mapped to a different ChannelForge identity'
        : 'ChannelForge identity is already mapped from a different legacy identity',
    );
    this.name = 'LegacyIdentityMappingConflictError';
  }
}

export class LegacyIdentityMappingNotFoundError extends Error {
  constructor() {
    super('Legacy identity mapping does not exist');
    this.name = 'LegacyIdentityMappingNotFoundError';
  }
}

export class LegacyIdentityMappingStatusError extends Error {
  constructor(readonly status: string) {
    super(`Legacy identity mapping cannot be verified from status ${status}`);
    this.name = 'LegacyIdentityMappingStatusError';
  }
}

export type EnsureLegacyIdentityMappingRequest = Readonly<{
  legacy: LegacyIdentityReference;
  channelForge: ChannelForgeIdentityReference;
  migrationRunId?: string;
  metadata?: Readonly<Record<string, unknown>>;
  now?: () => Date;
}>;

function requireNonEmpty(label: string, value: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RangeError(`${label} must not be empty`);
  }

  return normalized;
}

function requireOpaqueNonEmpty(label: string, value: string): string {
  if (value.trim().length === 0) {
    throw new RangeError(`${label} must not be empty`);
  }

  return value;
}

function sameLegacyIdentity(
  left: LegacyIdentityReference,
  right: LegacyIdentityReference,
): boolean {
  return (
    left.namespace === right.namespace &&
    left.entityType === right.entityType &&
    left.identifier === right.identifier
  );
}

function sameChannelForgeIdentity(
  left: ChannelForgeIdentityReference,
  right: ChannelForgeIdentityReference,
): boolean {
  return (
    left.entityType === right.entityType && left.identifier === right.identifier
  );
}

export class LegacyIdentityMappingService {
  constructor(
    private readonly repository: LegacyIdentityMappingRepository,
    private readonly conflictRepository?: MigrationConflictRepository,
  ) {}

  private recordConflict(
    reason: LegacyIdentityConflictReason,
    request: EnsureLegacyIdentityMappingRequest,
    existing: LegacyIdentityMapping,
    legacy: LegacyIdentityReference,
    channelForge: ChannelForgeIdentityReference,
  ): MigrationConflictId | undefined {
    if (
      this.conflictRepository === undefined ||
      request.migrationRunId === undefined
    ) {
      return undefined;
    }

    const conflictId = MigrationConflictId.generate();

    this.conflictRepository.insert(
      Object.freeze({
        migrationConflictId: conflictId,
        migrationRunId: request.migrationRunId,
        stepKey: 'legacy-identity-mapping',
        conflictType: reason,
        sourceReference: [
          legacy.namespace,
          legacy.entityType,
          legacy.identifier,
        ].join('/'),
        candidateTargets: Object.freeze([
          [
            existing.channelForge.entityType,
            existing.channelForge.identifier,
          ].join('/'),
          [channelForge.entityType, channelForge.identifier].join('/'),
        ]),
        status: 'OPEN',
        detectedAt: (request.now ?? (() => new Date()))().toISOString(),
        evidence: Object.freeze({
          existingMappingId: existing.mappingId,
          incomingLegacy: legacy,
          incomingChannelForge: channelForge,
        }),
      }),
    );

    return conflictId;
  }

  ensureOneToOneMapping(
    request: EnsureLegacyIdentityMappingRequest,
  ): LegacyIdentityMapping {
    const legacy: LegacyIdentityReference = Object.freeze({
      namespace: requireNonEmpty('legacy namespace', request.legacy.namespace),
      entityType: requireNonEmpty(
        'legacy entity type',
        request.legacy.entityType,
      ),
      identifier: requireOpaqueNonEmpty(
        'legacy identifier',
        request.legacy.identifier,
      ),
    });

    const channelForge: ChannelForgeIdentityReference = Object.freeze({
      entityType: requireNonEmpty(
        'ChannelForge entity type',
        request.channelForge.entityType,
      ),
      identifier: requireNonEmpty(
        'ChannelForge identifier',
        request.channelForge.identifier,
      ),
    });

    const existingLegacy = this.repository.findByLegacyIdentity(legacy);

    if (existingLegacy !== undefined) {
      if (sameChannelForgeIdentity(existingLegacy.channelForge, channelForge)) {
        return existingLegacy;
      }

      const conflictId = this.recordConflict(
        'LEGACY_ALREADY_MAPPED',
        request,
        existingLegacy,
        legacy,
        channelForge,
      );

      throw new LegacyIdentityMappingConflictError(
        'LEGACY_ALREADY_MAPPED',
        existingLegacy,
        conflictId,
      );
    }

    const existingTarget =
      this.repository.findByChannelForgeIdentity(channelForge);

    if (existingTarget !== undefined) {
      if (sameLegacyIdentity(existingTarget.legacy, legacy)) {
        return existingTarget;
      }

      const conflictId = this.recordConflict(
        'TARGET_ALREADY_MAPPED',
        request,
        existingTarget,
        legacy,
        channelForge,
      );

      throw new LegacyIdentityMappingConflictError(
        'TARGET_ALREADY_MAPPED',
        existingTarget,
        conflictId,
      );
    }

    const createdAt = (request.now ?? (() => new Date()))().toISOString();

    const mapping: LegacyIdentityMapping = Object.freeze({
      mappingId: LegacyIdentityMappingId.generate(),
      legacy,
      channelForge,
      cardinality: 'ONE_TO_ONE',
      status: 'MAPPED',
      ...(request.migrationRunId === undefined
        ? {}
        : { migrationRunId: request.migrationRunId }),
      createdAt,
      metadata: Object.freeze({
        ...(request.metadata ?? {}),
      }),
    });

    this.repository.insert(mapping);
    return mapping;
  }

  verifyMapping(
    mappingId: LegacyIdentityMappingId,
    now: () => Date = () => new Date(),
  ): LegacyIdentityMapping {
    const existing = this.repository.getById(mappingId);

    if (existing === undefined) {
      throw new LegacyIdentityMappingNotFoundError();
    }

    if (existing.status === 'VERIFIED') {
      return existing;
    }

    if (existing.status !== 'MAPPED') {
      throw new LegacyIdentityMappingStatusError(existing.status);
    }

    return this.repository.markVerified(mappingId, now().toISOString());
  }
}
