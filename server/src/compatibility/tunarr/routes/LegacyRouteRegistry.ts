import type { CompatibilityMode } from '../ports/index.js';

export const LegacyRouteClassifications = [
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
] as const;

export type LegacyRouteClassification =
  (typeof LegacyRouteClassifications)[number];

export const LegacyRouteRegistrationGroups = [
  'MANAGEMENT',
  'OUTPUT',
  'STREAM',
] as const;

export type LegacyRouteRegistrationGroup =
  (typeof LegacyRouteRegistrationGroups)[number];

export type LegacyRouteDeprecationMetadata = Readonly<{
  deprecated: boolean;
  replacement: string;
  supportWindow: string;
  behaviorDifferences: string;
  identifierDifferences: string;
  errorDifferences: string;
  removalGate: string;
  migrationGuidance: string;
}>;

export type LegacyRouteRegistration = Readonly<{
  method: string;
  path: string;
  classification: LegacyRouteClassification;
  registrationGroup: LegacyRouteRegistrationGroup;
  compatibilityMode: CompatibilityMode;
  tags: readonly string[];
  hidden: boolean;
  deprecation?: LegacyRouteDeprecationMetadata;
}>;

export type LegacyRouteRegistrySnapshot = Readonly<{
  routeCount: number;
  registrations: readonly LegacyRouteRegistration[];
}>;

const OUTPUT_PROTOCOL_PATHS = new Set([
  '/api/channels.m3u',
  '/api/xmltv.xml',
  '/discover.json',
  '/device.xml',
  '/lineup.json',
  '/lineup_status.json',
  '/lineup.post',
]);

const MEDIA_SOURCE_SETTINGS_PATH = '/api/settings/media-source';

function normalizeMethod(method: string): string {
  const normalized = method.trim().toUpperCase();

  if (normalized.length === 0) {
    throw new RangeError('legacy route method must not be empty');
  }

  return normalized;
}

function normalizePath(path: string): string {
  const normalized = path.trim();

  if (!normalized.startsWith('/')) {
    throw new RangeError('legacy route path must begin with /');
  }

  return normalized;
}

export function classifyTunarrLegacyRoute(
  path: string,
  hidden = false,
  method?: string,
): LegacyRouteClassification {
  const normalizedPath = normalizePath(path);

  if (
    hidden ||
    normalizedPath.startsWith('/api/debug') ||
    normalizedPath === '/api/cache/images'
  ) {
    return 'INTERNAL_ONLY';
  }

  if (normalizedPath === MEDIA_SOURCE_SETTINGS_PATH && method !== undefined) {
    const normalizedMethod = normalizeMethod(method);

    if (normalizedMethod === 'GET') {
      return 'ADAPT_READ';
    }

    if (normalizedMethod === 'PUT') {
      return 'ADAPT_WRITE';
    }
  }

  if (OUTPUT_PROTOCOL_PATHS.has(normalizedPath)) {
    return 'OUTPUT_PROTOCOL';
  }

  if (
    normalizedPath.startsWith('/stream/') ||
    normalizedPath === '/stream' ||
    normalizedPath.startsWith('/video/') ||
    normalizedPath === '/video'
  ) {
    return 'STREAM_PROTOCOL';
  }

  return 'UNKNOWN';
}

export function legacyRouteDeprecationMetadata(
  method: string,
  path: string,
): LegacyRouteDeprecationMetadata | undefined {
  const normalizedMethod = normalizeMethod(method);
  const normalizedPath = normalizePath(path);

  if (
    normalizedPath !== MEDIA_SOURCE_SETTINGS_PATH ||
    !['GET', 'PUT'].includes(normalizedMethod)
  ) {
    return undefined;
  }

  return Object.freeze({
    deprecated: false,
    replacement:
      'ChannelForge Media Sources application service; public management route deferred',
    supportWindow: 'M04 compatibility support window',
    behaviorDifferences:
      'Legacy request and response shapes remain unchanged; the handler now crosses the ChannelForge application boundary',
    identifierDifferences:
      'No identifiers are present in this settings contract',
    errorDifferences:
      'Existing HTTP schema/error behavior is preserved; canonical validation rejects invalid commands before inherited persistence',
    removalGate:
      'Publish replacement management route, migrate first-party generated client, observe zero supported use, complete support and rollback windows',
    migrationGuidance:
      'Continue using the compatibility route until the ChannelForge management replacement is published',
  });
}

export function legacyRouteRegistrationGroup(
  classification: LegacyRouteClassification,
): LegacyRouteRegistrationGroup {
  switch (classification) {
    case 'OUTPUT_PROTOCOL':
      return 'OUTPUT';

    case 'STREAM_PROTOCOL':
      return 'STREAM';

    default:
      return 'MANAGEMENT';
  }
}

export function legacyRouteCompatibilityMode(
  method: string,
  path: string,
): CompatibilityMode {
  const normalizedMethod = normalizeMethod(method);
  const normalizedPath = normalizePath(path);

  if (normalizedMethod === 'POST' && normalizedPath === '/api/jellyfin/login') {
    return 'CANONICAL_READ_LEGACY_FALLBACK';
  }

  return 'LEGACY_ONLY';
}

export function legacyRouteTags(
  existingTags: readonly string[] | undefined,
  classification: LegacyRouteClassification,
  hidden: boolean,
  deprecation?: LegacyRouteDeprecationMetadata,
): readonly string[] {
  if (hidden) {
    return Object.freeze([...(existingTags ?? [])]);
  }

  const tags = new Set(existingTags ?? []);

  tags.add('legacy');
  tags.add('compatibility');

  if (classification === 'DEPRECATE' || deprecation?.deprecated === true) {
    tags.add('deprecated');
  }

  return Object.freeze([...tags]);
}

function routeKey(method: string, path: string): string {
  return `${normalizeMethod(method)} ${normalizePath(path)}`;
}

export class LegacyRouteRegistry {
  private readonly registrations = new Map<string, LegacyRouteRegistration>();

  register(
    input: Readonly<{
      method: string;
      path: string;
      hidden?: boolean;
      existingTags?: readonly string[];
    }>,
  ): LegacyRouteRegistration {
    const method = normalizeMethod(input.method);
    const path = normalizePath(input.path);
    const hidden = input.hidden ?? false;

    const classification = classifyTunarrLegacyRoute(path, hidden, method);

    const deprecation = legacyRouteDeprecationMetadata(method, path);

    const registration: LegacyRouteRegistration = Object.freeze({
      method,
      path,
      classification,
      registrationGroup: legacyRouteRegistrationGroup(classification),
      compatibilityMode: legacyRouteCompatibilityMode(method, path),
      tags: legacyRouteTags(
        input.existingTags,
        classification,
        hidden,
        deprecation,
      ),
      hidden,
      ...(deprecation === undefined ? {} : { deprecation }),
    });

    this.registrations.set(routeKey(method, path), registration);

    return registration;
  }

  find(method: string, path: string): LegacyRouteRegistration | undefined {
    return this.registrations.get(routeKey(method, path));
  }

  snapshot(): LegacyRouteRegistrySnapshot {
    const registrations = [...this.registrations.values()].sort((left, right) =>
      `${left.path} ${left.method}`.localeCompare(
        `${right.path} ${right.method}`,
      ),
    );

    return Object.freeze({
      routeCount: registrations.length,
      registrations: Object.freeze(registrations),
    });
  }
}

export const tunarrLegacyRouteRegistry = new LegacyRouteRegistry();

export function getTunarrLegacyRouteRegistrySnapshot(): LegacyRouteRegistrySnapshot {
  return tunarrLegacyRouteRegistry.snapshot();
}
