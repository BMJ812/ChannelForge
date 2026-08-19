import type { LegacyIdentityReference } from '../domain/LegacyIdentityMapping.js';

import type {
  LegacyIdentityTombstone,
  LegacyIdentityTombstoneId,
} from '../domain/LegacyIdentityTombstone.js';

export class LegacyIdentityTombstoneConstraintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LegacyIdentityTombstoneConstraintError';
  }
}

export interface LegacyIdentityTombstoneRepository {
  getById(
    tombstoneId: LegacyIdentityTombstoneId,
  ): LegacyIdentityTombstone | undefined;

  findByLegacyIdentity(
    legacy: LegacyIdentityReference,
  ): LegacyIdentityTombstone | undefined;

  insert(tombstone: LegacyIdentityTombstone): void;
}
