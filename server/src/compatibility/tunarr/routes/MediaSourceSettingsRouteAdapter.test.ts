import { describe, expect, it } from 'vitest';

import {
  canonicalMediaSourceScanPolicyToLegacyResponse,
  createTunarrMediaSourceSettingsRouteAdapter,
  legacyMediaSourceSettingsRequestToCanonical,
} from './MediaSourceSettingsRouteAdapter.js';

describe('TunarrMediaSourceSettingsRouteAdapter', () => {
  it('translates the legacy request shape to the ChannelForge command shape', () => {
    expect(
      legacyMediaSourceSettingsRequestToCanonical({
        rescanIntervalHours: 8,
      }),
    ).toEqual({
      intervalHours: 8,
    });
  });

  it('translates the ChannelForge result back to the exact legacy response shape', () => {
    expect(
      canonicalMediaSourceScanPolicyToLegacyResponse({
        intervalHours: 10,
      }),
    ).toEqual({
      rescanIntervalHours: 10,
    });
  });

  it('adapts one legacy read and one legacy write through the canonical service', async () => {
    let persisted = {
      rescanIntervalHours: 6,
    };

    const adapter = createTunarrMediaSourceSettingsRouteAdapter({
      read: () => persisted,
      write: async (value) => {
        persisted = {
          ...value,
        };
      },
    });

    await expect(adapter.read()).resolves.toEqual({
      rescanIntervalHours: 6,
    });

    await expect(
      adapter.write({
        rescanIntervalHours: 12,
      }),
    ).resolves.toEqual({
      rescanIntervalHours: 12,
    });

    expect(persisted).toEqual({
      rescanIntervalHours: 12,
    });
  });

  it('fails before the inherited write when canonical validation rejects the command', async () => {
    let writes = 0;

    const adapter = createTunarrMediaSourceSettingsRouteAdapter({
      read: () => ({
        rescanIntervalHours: 6,
      }),
      write: async () => {
        writes += 1;
      },
    });

    await expect(
      adapter.write({
        rescanIntervalHours: -1,
      }),
    ).rejects.toThrow(RangeError);

    expect(writes).toBe(0);
  });
});
