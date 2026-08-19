import type {
  ChannelForgeIdentityReference,
  LegacyIdentityMapping,
  LegacyIdentityMappingId,
  LegacyIdentityReference,
} from '../domain/LegacyIdentityMapping.js';

export class LegacyIdentityMappingConstraintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LegacyIdentityMappingConstraintError';
  }
}

export interface LegacyIdentityMappingRepository {
  getById(
    mappingId: LegacyIdentityMappingId,
  ): LegacyIdentityMapping | undefined;

  findByLegacyIdentity(
    legacy: LegacyIdentityReference,
  ): LegacyIdentityMapping | undefined;

  findByChannelForgeIdentity(
    channelForge: ChannelForgeIdentityReference,
  ): LegacyIdentityMapping | undefined;

  insert(mapping: LegacyIdentityMapping): void;

  markVerified(
    mappingId: LegacyIdentityMappingId,
    verifiedAt: string,
  ): LegacyIdentityMapping;
}
