import { describe, expect, it } from 'vitest';

import {
  createMediaSourceScanPolicy,
  createMediaSourceScanPolicyApplicationService,
  type MediaSourceScanPolicy,
  type MediaSourceScanPolicyStore,
} from '../index.js';

class InMemoryScanPolicyStore implements MediaSourceScanPolicyStore {
  constructor(private policy: MediaSourceScanPolicy) {}

  async read(): Promise<MediaSourceScanPolicy> {
    return this.policy;
  }

  async write(policy: MediaSourceScanPolicy): Promise<void> {
    this.policy = policy;
  }
}

describe('MediaSourceScanPolicyApplicationService', () => {
  it('reads through the module-owned store port', async () => {
    const store = new InMemoryScanPolicyStore(
      createMediaSourceScanPolicy({
        intervalHours: 6,
      }),
    );

    const service = createMediaSourceScanPolicyApplicationService(store);

    await expect(service.getPolicy()).resolves.toEqual({
      intervalHours: 6,
    });
  });

  it('validates, writes, and reads back the authoritative representation', async () => {
    const store = new InMemoryScanPolicyStore(
      createMediaSourceScanPolicy({
        intervalHours: 6,
      }),
    );

    const service = createMediaSourceScanPolicyApplicationService(store);

    await expect(
      service.updatePolicy({
        intervalHours: 12,
      }),
    ).resolves.toEqual({
      intervalHours: 12,
    });

    await expect(store.read()).resolves.toEqual({
      intervalHours: 12,
    });
  });

  it('rejects invalid scan intervals before the store write', async () => {
    let writes = 0;

    const store: MediaSourceScanPolicyStore = {
      read: async () =>
        createMediaSourceScanPolicy({
          intervalHours: 6,
        }),
      write: async () => {
        writes += 1;
      },
    };

    const service = createMediaSourceScanPolicyApplicationService(store);

    await expect(
      service.updatePolicy({
        intervalHours: -1,
      }),
    ).rejects.toThrow(RangeError);

    expect(writes).toBe(0);
  });
});
