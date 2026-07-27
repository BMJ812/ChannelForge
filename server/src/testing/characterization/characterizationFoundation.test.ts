import { describe, expect, test } from 'vitest';
import {
  PROVIDER_FIXTURE_SCHEMA_VERSION,
  TEST_RANDOM_GENERATOR,
  checksumCanonicalJson,
  createManualTestClock,
  createSeededTestRandom,
  defineProviderContractFixture,
  serializeCanonicalJson,
} from './index.ts';

describe('characterization test foundation', () => {
  test('manual clock controls progression, rollback, and defensive Date values', () => {
    const clock = createManualTestClock('2026-07-27T12:00:00.000Z');
    const first = clock.now();

    first.setUTCFullYear(1999);

    expect(clock.snapshot()).toBe('2026-07-27T12:00:00.000Z');

    clock.advance(90_000);
    expect(clock.snapshot()).toBe('2026-07-27T12:01:30.000Z');

    clock.advance(-30_000);
    expect(clock.nowMs()).toBe(Date.parse('2026-07-27T12:01:00.000Z'));

    clock.set('2026-11-01T09:00:00.000Z');
    expect(clock.snapshot()).toBe('2026-11-01T09:00:00.000Z');
  });

  test('seeded random helper repeats the same sequence and records generator', () => {
    const first = createSeededTestRandom(42);
    const second = createSeededTestRandom(42);

    const firstSequence = Array.from({ length: 8 }, () =>
      first.random.integer(0, 1_000_000),
    );

    const secondSequence = Array.from({ length: 8 }, () =>
      second.random.integer(0, 1_000_000),
    );

    expect(first.generator).toBe(TEST_RANDOM_GENERATOR);
    expect(first.seed).toBe(42);
    expect(secondSequence).toEqual(firstSequence);
  });

  test('canonical JSON has stable keys, Unicode, arrays, newline, and checksum', () => {
    const value = {
      z: 1,
      list: [3, 2, 1],
      a: 'e\u0301',
    };

    expect(serializeCanonicalJson(value)).toBe(
      '{"a":"é","list":[3,2,1],"z":1}\n',
    );

    expect(checksumCanonicalJson(value)).toBe(
      '1a6a61aa450f9520d6723912b12ac1c5979ab235e0d562a01451e54f773d9498',
    );
  });

  test('provider fixture scaffold accepts synthetic sanitized contracts', () => {
    const fixture = defineProviderContractFixture({
      metadata: {
        provider: 'jellyfin',
        providerVersion: '10.synthetic',
        endpoint: '/Items',
        scenario: 'single movie normalization',
        sanitizationVersion: 1,
        fixtureSchemaVersion: PROVIDER_FIXTURE_SCHEMA_VERSION,
        source: 'synthetic',
        expectedNormalizedResult: {
          id: 'movie-1',
          title: 'Example Movie',
        },
      },
      request: {
        headers: {
          authorization: 'synthetic-token',
        },
      },
      response: {
        Id: 'movie-1',
        Name: 'Example Movie',
      },
    });

    expect(fixture.metadata.provider).toBe('jellyfin');
  });

  test('provider fixture scaffold rejects secret-like values and private paths', () => {
    expect(() =>
      defineProviderContractFixture({
        metadata: {
          provider: 'plex',
          providerVersion: '1.synthetic',
          endpoint: '/library/sections',
          scenario: 'secret rejection',
          sanitizationVersion: 1,
          fixtureSchemaVersion: PROVIDER_FIXTURE_SCHEMA_VERSION,
          source: 'synthetic',
          expectedNormalizedResult: null,
        },
        request: {
          token: 'real-provider-secret',
        },
        response: {},
      }),
    ).toThrow(/Unsanitized secret-like value/);

    expect(() =>
      defineProviderContractFixture({
        metadata: {
          provider: 'emby',
          providerVersion: '4.synthetic',
          endpoint: '/Items',
          scenario: 'private path rejection',
          sanitizationVersion: 1,
          fixtureSchemaVersion: PROVIDER_FIXTURE_SCHEMA_VERSION,
          source: 'synthetic',
          expectedNormalizedResult: null,
        },
        response: {
          path: 'Z:\\Users\\SyntheticUser\\Videos\\fixture.mkv',
        },
      }),
    ).toThrow(/Private profile path/);
  });
});
