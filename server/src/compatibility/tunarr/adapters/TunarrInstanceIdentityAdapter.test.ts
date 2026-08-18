import {
  createInstanceModule,
  type InstanceIdentityReader,
} from '@/modules/instance/index.js';
import { describe, expect, it } from 'vitest';

import { TunarrCompatibilityUsageMetrics } from '../usage/CompatibilityUsageMetrics.js';
import { TunarrInstanceIdentityAdapter } from './TunarrInstanceIdentityAdapter.js';

describe('TunarrInstanceIdentityAdapter', () => {
  it('translates the inherited client ID to ChannelForge instance identity', () => {
    const metrics = new TunarrCompatibilityUsageMetrics();
    const adapter = new TunarrInstanceIdentityAdapter(
      { clientId: () => 'legacy-client-id' },
      metrics,
    );

    expect(adapter.readInstanceIdentity()).toEqual({
      instanceId: 'legacy-client-id',
    });

    expect(metrics.snapshot()).toEqual({
      'instance-identity-read': 1,
    });
  });

  it('records every compatibility read', () => {
    const metrics = new TunarrCompatibilityUsageMetrics();
    const adapter = new TunarrInstanceIdentityAdapter(
      { clientId: () => 'legacy-client-id' },
      metrics,
    );

    adapter.readInstanceIdentity();
    adapter.readInstanceIdentity();

    expect(metrics.snapshot()).toEqual({
      'instance-identity-read': 2,
    });
  });

  it('satisfies the Instance-owned identity reader', () => {
    const metrics = new TunarrCompatibilityUsageMetrics();
    const adapter = new TunarrInstanceIdentityAdapter(
      { clientId: () => 'legacy-client-id' },
      metrics,
    );

    const identityReader: InstanceIdentityReader = adapter;

    const instance = createInstanceModule({
      identityReader,
    });

    expect(instance.queries.getInstanceIdentity()).toEqual({
      instanceId: 'legacy-client-id',
    });

    expect(metrics.snapshot()).toEqual({
      'instance-identity-read': 1,
    });
  });
});
