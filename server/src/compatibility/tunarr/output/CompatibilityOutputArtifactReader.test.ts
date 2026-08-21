import { describe, expect, it } from 'vitest';

import type {
  HdhrCompatibleIdentity,
  OutputArtifact,
  OutputArtifactReader,
  OutputStreamRoute,
} from '@/modules/output/index.js';

import type {
  CompatibilityCounterMetric,
  CompatibilityGaugeMetric,
  CompatibilityMetricDimensions,
  CompatibilityMetrics,
  CompatibilityTimingMetric,
} from '../ports/CompatibilityMetrics.js';
import {
  CompatibilityOutputArtifactReader,
  CompatibilityOutputUnavailableError,
  TunarrOutputCompatibilityRoutePaths,
  preserveLegacyHdhrIdentity,
  type CompatibilityOutputArtifactKind,
} from './CompatibilityOutputArtifactReader.js';

type CounterCall = Readonly<{
  metric: CompatibilityCounterMetric;
  dimensions: CompatibilityMetricDimensions;
}>;

class RecordingMetrics implements CompatibilityMetrics {
  readonly counters: CounterCall[] = [];

  increment(
    metric: CompatibilityCounterMetric,
    dimensions: CompatibilityMetricDimensions,
  ): void {
    this.counters.push({ metric, dimensions });
  }

  setGauge(
    _metric: CompatibilityGaugeMetric,
    _value: number,
    _dimensions: CompatibilityMetricDimensions,
  ): void {}

  observeMilliseconds(
    _metric: CompatibilityTimingMetric,
    _milliseconds: number,
    _dimensions: CompatibilityMetricDimensions,
  ): void {}
}

const artifacts = Object.freeze({
  XMLTV: Object.freeze({
    contentType: 'application/xml',
    body: '<tv></tv>',
    checksum: 'xmltv-checksum',
  }),
  M3U: Object.freeze({
    contentType: 'audio/x-mpegurl',
    body: '#EXTM3U',
    checksum: 'm3u-checksum',
  }),
  HDHR_DISCOVERY: Object.freeze({
    contentType: 'application/json',
    body: '{"DeviceID":"legacy-device"}',
  }),
  HDHR_LINEUP: Object.freeze({
    contentType: 'application/json',
    body: '[]',
  }),
} satisfies Record<CompatibilityOutputArtifactKind, OutputArtifact>);

function canonicalReader(
  overrides: Partial<
    Record<CompatibilityOutputArtifactKind, OutputArtifact | Error>
  > = {},
): OutputArtifactReader {
  const values = {
    ...artifacts,
    ...overrides,
  };

  function read(kind: CompatibilityOutputArtifactKind): OutputArtifact {
    const value = values[kind];

    if (value instanceof Error) {
      throw value;
    }

    return value;
  }

  return {
    async getXmltv() {
      return read('XMLTV');
    },
    async getM3u() {
      return read('M3U');
    },
    async getHdhrDiscovery() {
      return read('HDHR_DISCOVERY');
    },
    async getHdhrLineup() {
      return read('HDHR_LINEUP');
    },
    async resolveStreamRoute(): Promise<OutputStreamRoute> {
      return {
        channelId: 'channel-1',
        path: '/stream/channels/channel-1',
      };
    },
  };
}

describe('M04 output compatibility', () => {
  it('pins existing protocol route paths without query tokens', () => {
    expect(TunarrOutputCompatibilityRoutePaths).toEqual({
      xmltv: '/api/xmltv.xml',
      m3u: '/api/channels.m3u',
      hdhrDevice: '/device.xml',
      hdhrDiscovery: '/discover.json',
      hdhrLineupStatus: '/lineup_status.json',
      hdhrLineup: '/lineup.json',
      streamChannel: '/stream/channels/:id',
    });

    for (const path of Object.values(TunarrOutputCompatibilityRoutePaths)) {
      expect(path.startsWith('/')).toBe(true);
      expect(path).not.toContain('?');
      expect(path).not.toContain('#');
    }
  });

  it('prefers a valid canonical artifact without reading fallback stores', async () => {
    let lastValidReads = 0;
    let legacyReads = 0;

    const reader = new CompatibilityOutputArtifactReader({
      canonicalReader: canonicalReader(),
      lastValidReader: {
        async readLastValidArtifact() {
          lastValidReads += 1;
          return artifacts.XMLTV;
        },
      },
      legacyReader: {
        async readLegacyArtifact() {
          legacyReads += 1;
          return artifacts.XMLTV;
        },
      },
    });

    const result = await reader.readArtifact('XMLTV');

    expect(result).toMatchObject({
      outcome: 'RESOLVED',
      kind: 'XMLTV',
      source: 'CANONICAL',
      routePath: '/api/xmltv.xml',
    });
    expect(lastValidReads).toBe(0);
    expect(legacyReads).toBe(0);
  });

  it('uses last-valid canonical before legacy fallback', async () => {
    let legacyReads = 0;
    const lastValid = Object.freeze({
      contentType: 'application/xml',
      body: '<tv>last-valid</tv>',
    });
    const metrics = new RecordingMetrics();

    const reader = new CompatibilityOutputArtifactReader({
      canonicalReader: canonicalReader({
        XMLTV: new Error('canonical unavailable'),
      }),
      lastValidReader: {
        async readLastValidArtifact(kind) {
          return kind === 'XMLTV' ? lastValid : undefined;
        },
      },
      legacyReader: {
        async readLegacyArtifact() {
          legacyReads += 1;
          return artifacts.XMLTV;
        },
      },
      metrics,
    });

    const result = await reader.readArtifact('XMLTV');

    expect(result).toMatchObject({
      outcome: 'RESOLVED',
      source: 'LAST_VALID_CANONICAL',
    });

    if (result.outcome !== 'RESOLVED') {
      throw new Error('Expected last-valid artifact.');
    }

    expect(result.artifact.body).toBe('<tv>last-valid</tv>');
    expect(Object.isFrozen(result.artifact)).toBe(true);
    expect(legacyReads).toBe(0);
    expect(metrics.counters.map((call) => call.metric)).toContain(
      'LAST_VALID_OUTPUT_FALLBACKS',
    );
  });

  it('falls back to legacy only after canonical and last-valid artifacts fail', async () => {
    const metrics = new RecordingMetrics();
    const legacy = Object.freeze({
      contentType: 'audio/x-mpegurl',
      body: '#EXTM3U\n#EXTINF:-1,Legacy',
    });

    const reader = new CompatibilityOutputArtifactReader({
      canonicalReader: canonicalReader({
        M3U: new Error('canonical unavailable'),
      }),
      lastValidReader: {
        async readLastValidArtifact() {
          return undefined;
        },
      },
      legacyReader: {
        async readLegacyArtifact(kind) {
          return kind === 'M3U' ? legacy : undefined;
        },
      },
      metrics,
    });

    const result = await reader.readArtifact('M3U');

    expect(result).toMatchObject({
      outcome: 'RESOLVED',
      kind: 'M3U',
      source: 'LEGACY_FALLBACK',
      routePath: '/api/channels.m3u',
    });
    expect(metrics.counters.map((call) => call.metric)).toContain(
      'LEGACY_OUTPUT_FALLBACKS',
    );
  });

  it('returns and throws controlled unavailable state after all precedence levels fail', async () => {
    const metrics = new RecordingMetrics();
    const reader = new CompatibilityOutputArtifactReader({
      canonicalReader: canonicalReader({
        XMLTV: new Error('raw canonical failure'),
      }),
      lastValidReader: {
        async readLastValidArtifact() {
          return undefined;
        },
      },
      legacyReader: {
        async readLegacyArtifact() {
          throw new Error('raw legacy failure');
        },
      },
      metrics,
    });

    const result = await reader.readArtifact('XMLTV');

    expect(result).toEqual({
      outcome: 'UNAVAILABLE',
      kind: 'XMLTV',
      routePath: '/api/xmltv.xml',
      errorCode: 'COMPATIBILITY_UNAVAILABLE',
    });

    await expect(reader.getXmltv()).rejects.toMatchObject({
      name: 'CompatibilityOutputUnavailableError',
      code: 'COMPATIBILITY_UNAVAILABLE',
      artifactKind: 'XMLTV',
    });

    await expect(reader.getXmltv()).rejects.toBeInstanceOf(
      CompatibilityOutputUnavailableError,
    );

    expect(JSON.stringify(result)).not.toContain('raw legacy failure');
    expect(metrics.counters.map((call) => call.metric)).toContain(
      'OUTPUT_ARTIFACT_UNAVAILABLE',
    );
  });

  it('rejects structurally invalid canonical output before fallback', async () => {
    const fallback = Object.freeze({
      contentType: 'application/xml',
      body: '<tv>fallback</tv>',
    });

    const reader = new CompatibilityOutputArtifactReader({
      canonicalReader: canonicalReader({
        XMLTV: Object.freeze({
          contentType: '',
          body: '',
        }),
      }),
      lastValidReader: {
        async readLastValidArtifact() {
          return fallback;
        },
      },
    });

    const result = await reader.readArtifact('XMLTV');

    expect(result).toMatchObject({
      outcome: 'RESOLVED',
      source: 'LAST_VALID_CANONICAL',
    });
  });

  it('preserves HDHomeRun-compatible device identity without deriving a new ID', async () => {
    const legacyIdentity: HdhrCompatibleIdentity = Object.freeze({
      deviceId: '1234ABCD',
    });
    const metrics = new RecordingMetrics();

    expect(preserveLegacyHdhrIdentity(legacyIdentity)).toEqual(legacyIdentity);

    expect(() => preserveLegacyHdhrIdentity({ deviceId: '   ' })).toThrow(
      'must be non-empty',
    );

    const reader = new CompatibilityOutputArtifactReader({
      canonicalReader: canonicalReader(),
      legacyHdhrIdentityReader: {
        async readLegacyHdhrIdentity() {
          return legacyIdentity;
        },
      },
      metrics,
    });

    const result = await reader.readHdhrIdentity();

    expect(result).toEqual({
      outcome: 'RESOLVED',
      source: 'LEGACY_PRESERVED',
      identity: {
        deviceId: '1234ABCD',
      },
    });

    if (result.outcome !== 'RESOLVED') {
      throw new Error('Expected preserved HDHR identity.');
    }

    expect(Object.isFrozen(result.identity)).toBe(true);
    expect(metrics.counters.map((call) => call.metric)).toContain(
      'HDHR_IDENTITY_READS',
    );
  });

  it('keeps compatibility metric dimensions bounded and delegates stream routing unchanged', async () => {
    const metrics = new RecordingMetrics();
    const reader = new CompatibilityOutputArtifactReader({
      canonicalReader: canonicalReader(),
      metrics,
    });

    await reader.readArtifact('HDHR_LINEUP');

    const route = await reader.resolveStreamRoute('channel-1');

    expect(route.path).toBe('/stream/channels/channel-1');

    for (const call of metrics.counters) {
      const encoded = JSON.stringify(call.dimensions);
      expect(encoded).not.toContain('channel-1');
      expect(encoded).not.toContain('1234ABCD');
      expect(Object.keys(call.dimensions)).not.toContain('channelId');
      expect(Object.keys(call.dimensions)).not.toContain('deviceId');
    }
  });
});
