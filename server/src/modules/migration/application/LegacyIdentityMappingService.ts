import {
  LegacyIdentityMappingId,
  type ChannelForgeIdentityReference,
  type LegacyIdentityMapping,
  type LegacyIdentityReference,
} from '../domain/LegacyIdentityMapping.js';
import type { LegacyIdentityMappingRepository } from '../ports/LegacyIdentityMappingRepository.js';

export type LegacyIdentityConflictReason =
  | 'LEGACY_ALREADY_MAPPED'
  | 'TARGET_ALREADY_MAPPED';

export class LegacyIdentityMappingConflictError extends Error {
  constructor(
    readonly reason: LegacyIdentityConflictReason,
    readonly existing: LegacyIdentityMapping,
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
  constructor(private readonly repository: LegacyIdentityMappingRepository) {}

  ensureOneToOneMapping(
    request: EnsureLegacyIdentityMappingRequest,
  ): LegacyIdentityMapping {
    const legacy: LegacyIdentityReference = Object.freeze({
      namespace: requireNonEmpty('legacy namespace', request.legacy.namespace),
      entityType: requireNonEmpty(
        'legacy entity type',
        request.legacy.entityType,
      ),
      identifier: requireNonEmpty(
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

      throw new LegacyIdentityMappingConflictError(
        'LEGACY_ALREADY_MAPPED',
        existingLegacy,
      );
    }

    const existingTarget =
      this.repository.findByChannelForgeIdentity(channelForge);

    if (existingTarget !== undefined) {
      if (sameLegacyIdentity(existingTarget.legacy, legacy)) {
        return existingTarget;
      }

      throw new LegacyIdentityMappingConflictError(
        'TARGET_ALREADY_MAPPED',
        existingTarget,
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
