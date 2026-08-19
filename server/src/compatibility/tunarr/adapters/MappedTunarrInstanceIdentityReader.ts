import {
  InstanceId,
  type InstanceIdentity,
  type InstanceIdentityReader,
  type InstanceRepository,
} from '@/modules/instance/index.js';

import type { LegacyIdentityMappingRepository } from '@/modules/migration/index.js';

import { InstanceIdentityShadowMetrics } from '../usage/InstanceIdentityShadowMetrics.js';

export class MappedTunarrInstanceIdentityReader
  implements InstanceIdentityReader
{
  constructor(
    private readonly legacyReader: InstanceIdentityReader,

    private readonly instanceRepository: InstanceRepository,

    private readonly mappingRepository: LegacyIdentityMappingRepository,

    private readonly shadowMetrics: InstanceIdentityShadowMetrics = new InstanceIdentityShadowMetrics(),
  ) {}

  readInstanceIdentity(): InstanceIdentity {
    const legacy = this.legacyReader.readInstanceIdentity();

    const instance = this.instanceRepository.get();

    if (instance === undefined) {
      this.shadowMetrics.record(
        'CHANNELFORGE_INSTANCE_MISSING',
        legacy.instanceId,
        null,
      );

      return legacy;
    }

    const channelForgeInstanceId = InstanceId.toString(instance.instanceId);

    const mapping = this.mappingRepository.findByLegacyIdentity({
      namespace: 'tunarr',

      entityType: 'instance',

      identifier: legacy.instanceId,
    });

    if (mapping === undefined) {
      this.shadowMetrics.record(
        'MAPPING_MISSING',
        legacy.instanceId,
        channelForgeInstanceId,
      );

      return legacy;
    }

    if (mapping.status !== 'VERIFIED') {
      this.shadowMetrics.record(
        'MAPPING_NOT_VERIFIED',
        legacy.instanceId,
        channelForgeInstanceId,
      );

      return legacy;
    }

    if (mapping.channelForge.entityType !== 'instance') {
      this.shadowMetrics.record(
        'TARGET_TYPE_MISMATCH',
        legacy.instanceId,
        channelForgeInstanceId,
      );

      return legacy;
    }

    if (mapping.channelForge.identifier !== channelForgeInstanceId) {
      this.shadowMetrics.record(
        'TARGET_IDENTITY_MISMATCH',
        legacy.instanceId,
        channelForgeInstanceId,
      );

      return legacy;
    }

    this.shadowMetrics.record(
      'MAPPED_MATCH',
      legacy.instanceId,
      channelForgeInstanceId,
    );

    return Object.freeze({
      instanceId: channelForgeInstanceId,
    });
  }

  getShadowSnapshot() {
    return this.shadowMetrics.snapshot();
  }
}
