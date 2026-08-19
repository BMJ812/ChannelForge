import { describe, expect, it } from 'vitest';

import {
  InstanceId,
  type InstanceIdentityReader,
  type InstanceRepository,
  type InstanceUpdate,
  type PersistedInstance,
} from '@/modules/instance/index.js';

import {
  LegacyIdentityMappingId,
  type ChannelForgeIdentityReference,
  type LegacyIdentityMapping,
  type LegacyIdentityMappingIdentifier,
  type LegacyIdentityMappingRepository,
  type LegacyIdentityReference,
} from '@/modules/migration/index.js';

import { InstanceIdentityShadowMetrics } from '../usage/InstanceIdentityShadowMetrics.js';

import { MappedTunarrInstanceIdentityReader } from './MappedTunarrInstanceIdentityReader.js';

class StaticInstanceRepository implements InstanceRepository {
  constructor(private readonly instance: PersistedInstance | undefined) {}

  get(): PersistedInstance | undefined {
    return this.instance;
  }

  insert(): void {
    throw new Error('Not used in read proof');
  }

  update(_update: InstanceUpdate, _expectedVersion: number): PersistedInstance {
    throw new Error('Not used in read proof');
  }
}

class StaticMappingRepository implements LegacyIdentityMappingRepository {
  constructor(private readonly mappings: readonly LegacyIdentityMapping[]) {}

  getById(
    mappingId: LegacyIdentityMappingIdentifier,
  ): LegacyIdentityMapping | undefined {
    return this.mappings.find((mapping) => mapping.mappingId === mappingId);
  }

  findByLegacyIdentity(
    legacy: LegacyIdentityReference,
  ): LegacyIdentityMapping | undefined {
    return this.mappings.find(
      (mapping) =>
        mapping.legacy.namespace === legacy.namespace &&
        mapping.legacy.entityType === legacy.entityType &&
        mapping.legacy.identifier === legacy.identifier,
    );
  }

  findByChannelForgeIdentity(
    channelForge: ChannelForgeIdentityReference,
  ): LegacyIdentityMapping | undefined {
    return this.mappings.find(
      (mapping) =>
        mapping.channelForge.entityType === channelForge.entityType &&
        mapping.channelForge.identifier === channelForge.identifier,
    );
  }

  insert(): void {
    throw new Error('Not used in read proof');
  }

  markVerified(): LegacyIdentityMapping {
    throw new Error('Not used in read proof');
  }
}

function createInstance(): PersistedInstance {
  const instanceId = InstanceId.generate();

  return Object.freeze({
    instanceId,
    displayName: 'ChannelForge',
    defaultTimeZone: 'UTC',
    setupState: 'READY',
    schemaVersion: 5,
    applicationVersion: 'test',
    createdAt: '2026-08-19T01:15:00.000Z',
    updatedAt: '2026-08-19T01:15:00.000Z',
    version: 1,
  });
}

function createVerifiedMapping(
  legacyInstanceId: string,
  channelForgeInstanceId: string,
): LegacyIdentityMapping {
  return Object.freeze({
    mappingId: LegacyIdentityMappingId.generate(),

    legacy: Object.freeze({
      namespace: 'tunarr',
      entityType: 'instance',
      identifier: legacyInstanceId,
    }),

    channelForge: Object.freeze({
      entityType: 'instance',
      identifier: channelForgeInstanceId,
    }),

    cardinality: 'ONE_TO_ONE',

    status: 'VERIFIED',

    createdAt: '2026-08-19T01:15:00.000Z',

    verifiedAt: '2026-08-19T01:16:00.000Z',

    metadata: Object.freeze({}),
  });
}

describe('MappedTunarrInstanceIdentityReader', () => {
  it('uses a verified mapping to resolve the canonical ChannelForge InstanceId', () => {
    const instance = createInstance();

    const legacyReader: InstanceIdentityReader = {
      readInstanceIdentity: () =>
        Object.freeze({
          instanceId: 'legacy-client-id',
        }),
    };

    const metrics = new InstanceIdentityShadowMetrics();

    const reader = new MappedTunarrInstanceIdentityReader(
      legacyReader,
      new StaticInstanceRepository(instance),
      new StaticMappingRepository([
        createVerifiedMapping(
          'legacy-client-id',
          InstanceId.toString(instance.instanceId),
        ),
      ]),
      metrics,
    );

    expect(reader.readInstanceIdentity()).toEqual({
      instanceId: InstanceId.toString(instance.instanceId),
    });

    expect(reader.getShadowSnapshot()).toEqual({
      mappedReads: 1,
      legacyFallbacks: 0,
      mismatches: 0,
      lastFinding: {
        code: 'MAPPED_MATCH',
        legacyInstanceId: 'legacy-client-id',
        channelForgeInstanceId: InstanceId.toString(instance.instanceId),
      },
    });
  });

  it('falls back to legacy identity when no verified mapping exists', () => {
    const instance = createInstance();

    const legacyReader: InstanceIdentityReader = {
      readInstanceIdentity: () =>
        Object.freeze({
          instanceId: 'legacy-client-id',
        }),
    };

    const reader = new MappedTunarrInstanceIdentityReader(
      legacyReader,
      new StaticInstanceRepository(instance),
      new StaticMappingRepository([]),
    );

    expect(reader.readInstanceIdentity()).toEqual({
      instanceId: 'legacy-client-id',
    });

    expect(reader.getShadowSnapshot().legacyFallbacks).toBe(1);
  });

  it('records an observable mismatch and preserves legacy authority', () => {
    const instance = createInstance();

    const legacyReader: InstanceIdentityReader = {
      readInstanceIdentity: () =>
        Object.freeze({
          instanceId: 'legacy-client-id',
        }),
    };

    const reader = new MappedTunarrInstanceIdentityReader(
      legacyReader,
      new StaticInstanceRepository(instance),
      new StaticMappingRepository([
        createVerifiedMapping(
          'legacy-client-id',
          InstanceId.toString(InstanceId.generate()),
        ),
      ]),
    );

    expect(reader.readInstanceIdentity()).toEqual({
      instanceId: 'legacy-client-id',
    });

    expect(reader.getShadowSnapshot()).toMatchObject({
      mappedReads: 0,
      legacyFallbacks: 1,
      mismatches: 1,
      lastFinding: {
        code: 'TARGET_IDENTITY_MISMATCH',
      },
    });
  });
});
