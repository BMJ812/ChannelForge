import { describe, expect, it } from 'vitest';

import { RuntimeCompatibilityMetrics } from '../usage/RuntimeCompatibilityMetrics.js';

import {
  classifyTunarrLegacyRoute,
  legacyRouteCompatibilityMode,
  legacyRouteDeprecationMetadata,
  LegacyRouteClassifications,
  LegacyRouteRegistry,
} from './LegacyRouteRegistry.js';

import { LegacyRouteUsageMetrics } from './LegacyRouteUsageMetrics.js';

describe('LegacyRouteRegistry', () => {
  it('uses the exact M04 classification vocabulary', () => {
    expect(LegacyRouteClassifications).toEqual([
      'PRESERVE_EXACT',
      'ADAPT_READ',
      'ADAPT_WRITE',
      'TRANSLATE_RESPONSE',
      'DEPRECATE',
      'FREEZE_WRITE',
      'INTERNAL_ONLY',
      'OUTPUT_PROTOCOL',
      'STREAM_PROTOCOL',
      'REMOVE_LATER',
      'UNKNOWN',
    ]);
  });

  it.each([
    ['/api/channels.m3u', 'OUTPUT_PROTOCOL'],
    ['/api/xmltv.xml', 'OUTPUT_PROTOCOL'],
    ['/discover.json', 'OUTPUT_PROTOCOL'],
    ['/lineup.json', 'OUTPUT_PROTOCOL'],
    ['/stream/channels/:id.m3u8', 'STREAM_PROTOCOL'],
    ['/video/:id', 'STREAM_PROTOCOL'],
    ['/api/debug/db', 'INTERNAL_ONLY'],
    ['/api/channels/:id', 'UNKNOWN'],
  ] as const)('classifies %s as %s', (path, classification) => {
    expect(classifyTunarrLegacyRoute(path)).toBe(classification);
  });

  it('classifies the 04G proof routes by method', () => {
    expect(
      classifyTunarrLegacyRoute('/api/settings/media-source', false, 'GET'),
    ).toBe('ADAPT_READ');

    expect(
      classifyTunarrLegacyRoute('/api/settings/media-source', false, 'PUT'),
    ).toBe('ADAPT_WRITE');
  });

  it('records deprecation-planning metadata without falsely deprecating the route', () => {
    const metadata = legacyRouteDeprecationMetadata(
      'GET',
      '/api/settings/media-source',
    );

    expect(metadata).toMatchObject({
      deprecated: false,
    });

    expect(metadata?.replacement).toContain(
      'Media Sources application service',
    );

    expect(metadata?.removalGate).toContain(
      'migrate first-party generated client',
    );
  });

  it('keeps the Jellyfin login compatibility mode intact', () => {
    expect(legacyRouteCompatibilityMode('POST', '/api/jellyfin/login')).toBe(
      'CANONICAL_READ_LEGACY_FALLBACK',
    );

    expect(
      legacyRouteCompatibilityMode('GET', '/api/settings/media-source'),
    ).toBe('LEGACY_ONLY');
  });

  it('deduplicates method/path pairs and adds compatibility tags', () => {
    const registry = new LegacyRouteRegistry();

    const first = registry.register({
      method: 'GET',
      path: '/api/channels',
      existingTags: ['Channels'],
    });

    const second = registry.register({
      method: 'GET',
      path: '/api/channels',
      existingTags: ['Channels'],
    });

    expect(first.tags).toEqual(['Channels', 'legacy', 'compatibility']);

    expect(second).toEqual(first);
    expect(registry.snapshot().routeCount).toBe(1);
  });

  it('attaches the 04G adapter classification and deprecation metadata', () => {
    const registry = new LegacyRouteRegistry();

    const readRoute = registry.register({
      method: 'GET',
      path: '/api/settings/media-source',
      existingTags: ['Settings'],
    });

    const writeRoute = registry.register({
      method: 'PUT',
      path: '/api/settings/media-source',
      existingTags: ['Settings'],
    });

    expect(readRoute).toMatchObject({
      classification: 'ADAPT_READ',
      compatibilityMode: 'LEGACY_ONLY',
      deprecation: {
        deprecated: false,
      },
    });

    expect(writeRoute).toMatchObject({
      classification: 'ADAPT_WRITE',
      compatibilityMode: 'LEGACY_ONLY',
      deprecation: {
        deprecated: false,
      },
    });

    expect(readRoute.tags).toEqual(['Settings', 'legacy', 'compatibility']);
  });

  it('keeps hidden routes hidden instead of adding visible tags', () => {
    const registry = new LegacyRouteRegistry();

    const route = registry.register({
      method: 'GET',
      path: '/api/debug/hidden',
      hidden: true,
      existingTags: ['Debug'],
    });

    expect(route).toMatchObject({
      classification: 'INTERNAL_ONLY',
      hidden: true,
      tags: ['Debug'],
    });
  });

  it('records bounded template metrics rather than concrete IDs', () => {
    const metrics = new RuntimeCompatibilityMetrics();

    const usage = new LegacyRouteUsageMetrics(metrics, '04g-test');

    const registry = new LegacyRouteRegistry();

    const route = registry.register({
      method: 'GET',
      path: '/api/channels/:id',
    });

    usage.recordCall(route);
    usage.recordLatency(route, 12.5, 'SUCCESS');

    const snapshot = metrics.snapshot();

    expect(
      snapshot.counters.some(
        (entry) =>
          entry.metric === 'LEGACY_ROUTE_CALLS' &&
          entry.dimensions.routeTemplate === '/api/channels/:id' &&
          entry.dimensions.operation === 'legacy-route:GET',
      ),
    ).toBe(true);

    expect(
      snapshot.timings.some(
        (entry) =>
          entry.metric === 'COMPATIBILITY_LATENCY' && entry.count === 1,
      ),
    ).toBe(true);

    expect(JSON.stringify(snapshot)).not.toContain('channel-123');
  });
});
