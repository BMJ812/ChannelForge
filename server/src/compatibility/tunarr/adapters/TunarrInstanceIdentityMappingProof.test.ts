import { describe, expect, it } from 'vitest';

import { InstanceId } from '@/modules/instance/index.js';

import {
  LegacyIdentityMappingService,
  type ChannelForgeIdentityReference,
  type LegacyIdentityMapping,
  type LegacyIdentityMappingIdentifier,
  type LegacyIdentityMappingRepository,
  type LegacyIdentityReference,
} from '@/modules/migration/index.js';

import { TunarrInstanceIdentityAdapter } from './TunarrInstanceIdentityAdapter.js';

class InMemoryLegacyIdentityMappingRepository
  implements LegacyIdentityMappingRepository
{
  private mapping: LegacyIdentityMapping | undefined;

  getById(
    mappingId: LegacyIdentityMappingIdentifier,
  ): LegacyIdentityMapping | undefined {
    return this.mapping?.mappingId === mappingId ? this.mapping : undefined;
  }

  findByLegacyIdentity(
    legacy: LegacyIdentityReference,
  ): LegacyIdentityMapping | undefined {
    const mapping = this.mapping;

    if (mapping === undefined) {
      return undefined;
    }

    return mapping.legacy.namespace === legacy.namespace &&
      mapping.legacy.entityType === legacy.entityType &&
      mapping.legacy.identifier === legacy.identifier
      ? mapping
      : undefined;
  }

  findByChannelForgeIdentity(
    channelForge: ChannelForgeIdentityReference,
  ): LegacyIdentityMapping | undefined {
    const mapping = this.mapping;

    if (mapping === undefined) {
      return undefined;
    }

    return mapping.channelForge.entityType === channelForge.entityType &&
      mapping.channelForge.identifier === channelForge.identifier
      ? mapping
      : undefined;
  }

  insert(mapping: LegacyIdentityMapping): void {
    this.mapping = mapping;
  }

  markVerified(
    mappingId: LegacyIdentityMappingIdentifier,
    verifiedAt: string,
  ): LegacyIdentityMapping {
    const mapping = this.getById(mappingId);

    if (mapping === undefined) {
      throw new Error('Mapping not found');
    }

    const verified: LegacyIdentityMapping = Object.freeze({
      ...mapping,
      status: 'VERIFIED',
      verifiedAt,
    });

    this.mapping = verified;

    return verified;
  }
}

describe('Tunarr Instance identity mapping proof', () => {
  it('keeps inherited Tunarr identity distinct from canonical ChannelForge identity', () => {
    const legacyClientId = 'legacy-client-id';

    const adapter = new TunarrInstanceIdentityAdapter({
      clientId: () => legacyClientId,
    });

    const inherited = adapter.readInstanceIdentity();

    const channelForgeInstanceId = InstanceId.generate();

    expect(inherited.instanceId).toBe(legacyClientId);

    expect(inherited.instanceId).not.toBe(
      InstanceId.toString(channelForgeInstanceId),
    );

    const repository = new InMemoryLegacyIdentityMappingRepository();

    const service = new LegacyIdentityMappingService(repository);

    const mapping = service.ensureOneToOneMapping({
      legacy: {
        namespace: 'tunarr',
        entityType: 'instance',
        identifier: inherited.instanceId,
      },
      channelForge: {
        entityType: 'instance',
        identifier: InstanceId.toString(channelForgeInstanceId),
      },
      metadata: {
        source: 'SettingsDB.clientId',
      },
    });

    expect(mapping.legacy.identifier).toBe(legacyClientId);

    expect(mapping.channelForge.identifier).toBe(
      InstanceId.toString(channelForgeInstanceId),
    );

    expect(mapping.channelForge.identifier).not.toBe(mapping.legacy.identifier);
  });
});
