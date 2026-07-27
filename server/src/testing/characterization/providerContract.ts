import {
  serializeCanonicalJson,
  type CanonicalJsonValue,
} from './canonicalJson.ts';

export const PROVIDER_FIXTURE_SCHEMA_VERSION = 1;

export type ProviderFixtureSource =
  | 'hand-authored'
  | 'sanitized-recording'
  | 'synthetic';

export type ProviderFixtureProvider = 'emby' | 'jellyfin' | 'local' | 'plex';

export interface ProviderFixtureMetadata {
  provider: ProviderFixtureProvider;
  providerVersion: string;
  endpoint: string;
  scenario: string;
  sanitizationVersion: number;
  fixtureSchemaVersion: typeof PROVIDER_FIXTURE_SCHEMA_VERSION;
  source: ProviderFixtureSource;
  expectedNormalizedResult: CanonicalJsonValue;
}

export interface ProviderContractFixture {
  metadata: ProviderFixtureMetadata;
  request?: CanonicalJsonValue;
  response: CanonicalJsonValue;
}

const secretKeyPattern =
  /(authorization|cookie|credential|password|secret|token|api[-_]?key)/i;

const windowsProfilePattern =
  /^[A-Za-z]:[\\/](Documents and Settings|Users)[\\/]/i;

const unixProfilePattern = /^\/(home|Users)\/[^/]+\//;

const emailPattern =
  /[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,}|localhost)/gi;

function isSyntheticSecret(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return (
    normalized === '' ||
    normalized === '<redacted>' ||
    normalized === '[redacted]' ||
    normalized === 'redacted' ||
    normalized.startsWith('expired-') ||
    normalized.startsWith('invalid-') ||
    normalized.startsWith('synthetic-') ||
    normalized.startsWith('test-')
  );
}

function assertSafeString(value: string, path: string): void {
  if (windowsProfilePattern.test(value) || unixProfilePattern.test(value)) {
    throw new Error(`Private profile path found at ${path}`);
  }

  for (const match of value.matchAll(emailPattern)) {
    const domain = (match[1] ?? '').toLowerCase();

    if (
      domain !== 'example.com' &&
      domain !== 'example.invalid' &&
      domain !== 'localhost'
    ) {
      throw new Error(`Non-synthetic email found at ${path}`);
    }
  }

  try {
    const url = new URL(value);

    if (url.username || url.password) {
      throw new Error(`URL credentials found at ${path}`);
    }

    for (const [key, parameterValue] of url.searchParams.entries()) {
      if (secretKeyPattern.test(key) && !isSyntheticSecret(parameterValue)) {
        throw new Error(`URL secret found at ${path}.${key}`);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('URL ')) {
      throw error;
    }
  }
}

function assertFixtureSafe(value: CanonicalJsonValue, path: string): void {
  if (typeof value === 'string') {
    assertSafeString(value, path);
    return;
  }

  if (value === null || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      assertFixtureSafe(entry, `${path}[${index}]`),
    );
    return;
  }

  for (const [key, entryValue] of Object.entries(value)) {
    const entryPath = `${path}.${key}`;

    if (
      secretKeyPattern.test(key) &&
      typeof entryValue === 'string' &&
      !isSyntheticSecret(entryValue)
    ) {
      throw new Error(`Unsanitized secret-like value found at ${entryPath}`);
    }

    assertFixtureSafe(entryValue, entryPath);
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`Provider fixture ${field} must not be empty`);
  }
}

/**
 * Validates fixture metadata, JSON compatibility, and baseline sanitization.
 * The helper performs no network or filesystem access.
 */
export function defineProviderContractFixture<
  const TFixture extends ProviderContractFixture,
>(fixture: TFixture): TFixture {
  const { metadata } = fixture;

  assertNonEmpty(metadata.providerVersion, 'providerVersion');
  assertNonEmpty(metadata.endpoint, 'endpoint');
  assertNonEmpty(metadata.scenario, 'scenario');

  if (metadata.fixtureSchemaVersion !== PROVIDER_FIXTURE_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported provider fixture schema: ${metadata.fixtureSchemaVersion}`,
    );
  }

  if (
    !Number.isSafeInteger(metadata.sanitizationVersion) ||
    metadata.sanitizationVersion < 1
  ) {
    throw new Error(
      `Invalid sanitization version: ${metadata.sanitizationVersion}`,
    );
  }

  const canonicalFixture = JSON.parse(
    serializeCanonicalJson(fixture),
  ) as CanonicalJsonValue;

  assertFixtureSafe(canonicalFixture, '$');

  return fixture;
}
