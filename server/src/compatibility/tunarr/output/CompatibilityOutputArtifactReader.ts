import type {
  HdhrCompatibleIdentity,
  OutputArtifact,
  OutputArtifactReader,
  OutputStreamRoute,
} from '@/modules/output/index.js';

import type {
  CompatibilityCounterMetric,
  CompatibilityMetricDimensions,
  CompatibilityMetricResult,
  CompatibilityMetrics,
} from '../ports/CompatibilityMetrics.js';

export const CompatibilityOutputArtifactKinds = [
  'XMLTV',
  'M3U',
  'HDHR_DISCOVERY',
  'HDHR_LINEUP',
] as const;

export type CompatibilityOutputArtifactKind =
  (typeof CompatibilityOutputArtifactKinds)[number];

export const TunarrOutputCompatibilityRoutePaths = Object.freeze({
  xmltv: '/api/xmltv.xml',
  m3u: '/api/channels.m3u',
  hdhrDevice: '/device.xml',
  hdhrDiscovery: '/discover.json',
  hdhrLineupStatus: '/lineup_status.json',
  hdhrLineup: '/lineup.json',
  streamChannel: '/stream/channels/:id',
} as const);

export const CompatibilityOutputArtifactSources = [
  'CANONICAL',
  'LAST_VALID_CANONICAL',
  'LEGACY_FALLBACK',
] as const;

export type CompatibilityOutputArtifactSource =
  (typeof CompatibilityOutputArtifactSources)[number];

export interface CompatibilityLastValidOutputArtifactReader {
  readLastValidArtifact(
    kind: CompatibilityOutputArtifactKind,
  ): Promise<OutputArtifact | undefined>;
}

export interface CompatibilityLegacyOutputArtifactReader {
  readLegacyArtifact(
    kind: CompatibilityOutputArtifactKind,
  ): Promise<OutputArtifact | undefined>;
}

export interface CompatibilityLegacyHdhrIdentityReader {
  readLegacyHdhrIdentity(): Promise<HdhrCompatibleIdentity | undefined>;
}

export interface CompatibilityOutputArtifactValidator {
  isValidArtifact(
    kind: CompatibilityOutputArtifactKind,
    artifact: OutputArtifact,
  ): boolean;
}

export type CompatibilityOutputArtifactResolved = Readonly<{
  outcome: 'RESOLVED';
  kind: CompatibilityOutputArtifactKind;
  source: CompatibilityOutputArtifactSource;
  artifact: OutputArtifact;
  routePath: string;
}>;

export type CompatibilityOutputArtifactUnavailable = Readonly<{
  outcome: 'UNAVAILABLE';
  kind: CompatibilityOutputArtifactKind;
  routePath: string;
  errorCode: 'COMPATIBILITY_UNAVAILABLE';
}>;

export type CompatibilityOutputArtifactReadResult =
  | CompatibilityOutputArtifactResolved
  | CompatibilityOutputArtifactUnavailable;

export type CompatibilityHdhrIdentityReadResult =
  | Readonly<{
      outcome: 'RESOLVED';
      source: 'LEGACY_PRESERVED';
      identity: HdhrCompatibleIdentity;
    }>
  | Readonly<{
      outcome: 'UNAVAILABLE';
      errorCode: 'COMPATIBILITY_UNAVAILABLE';
    }>;

export type CompatibilityOutputArtifactReaderOptions = Readonly<{
  canonicalReader: OutputArtifactReader;
  lastValidReader?: CompatibilityLastValidOutputArtifactReader;
  legacyReader?: CompatibilityLegacyOutputArtifactReader;
  legacyHdhrIdentityReader?: CompatibilityLegacyHdhrIdentityReader;
  artifactValidator?: CompatibilityOutputArtifactValidator;
  metrics?: CompatibilityMetrics;
}>;

const DefaultArtifactValidator: CompatibilityOutputArtifactValidator =
  Object.freeze({
    isValidArtifact(
      _kind: CompatibilityOutputArtifactKind,
      artifact: OutputArtifact,
    ): boolean {
      return (
        artifact.contentType.trim().length > 0 &&
        artifact.body.trim().length > 0
      );
    },
  });

function routePathForKind(kind: CompatibilityOutputArtifactKind): string {
  switch (kind) {
    case 'XMLTV':
      return TunarrOutputCompatibilityRoutePaths.xmltv;
    case 'M3U':
      return TunarrOutputCompatibilityRoutePaths.m3u;
    case 'HDHR_DISCOVERY':
      return TunarrOutputCompatibilityRoutePaths.hdhrDiscovery;
    case 'HDHR_LINEUP':
      return TunarrOutputCompatibilityRoutePaths.hdhrLineup;
  }
}

function operationForKind(kind: CompatibilityOutputArtifactKind): string {
  switch (kind) {
    case 'XMLTV':
      return 'xmltv-read';
    case 'M3U':
      return 'm3u-read';
    case 'HDHR_DISCOVERY':
      return 'hdhr-discovery-read';
    case 'HDHR_LINEUP':
      return 'hdhr-lineup-read';
  }
}

function freezeArtifact(artifact: OutputArtifact): OutputArtifact {
  return Object.freeze({
    contentType: artifact.contentType,
    body: artifact.body,
    ...(artifact.checksum === undefined ? {} : { checksum: artifact.checksum }),
  });
}

export function preserveLegacyHdhrIdentity(
  identity: HdhrCompatibleIdentity,
): HdhrCompatibleIdentity {
  if (identity.deviceId.trim().length === 0) {
    throw new Error('HDHomeRun-compatible device identity must be non-empty.');
  }

  return Object.freeze({
    deviceId: identity.deviceId,
  });
}

export class CompatibilityOutputUnavailableError extends Error {
  readonly code = 'COMPATIBILITY_UNAVAILABLE' as const;

  constructor(readonly artifactKind: CompatibilityOutputArtifactKind) {
    super(`Output artifact unavailable: ${artifactKind}`);
    this.name = 'CompatibilityOutputUnavailableError';
  }
}

export class CompatibilityOutputArtifactReader implements OutputArtifactReader {
  private readonly canonicalReader: OutputArtifactReader;
  private readonly lastValidReader?: CompatibilityLastValidOutputArtifactReader;
  private readonly legacyReader?: CompatibilityLegacyOutputArtifactReader;
  private readonly legacyHdhrIdentityReader?: CompatibilityLegacyHdhrIdentityReader;
  private readonly validator: CompatibilityOutputArtifactValidator;
  private readonly metrics?: CompatibilityMetrics;

  constructor(options: CompatibilityOutputArtifactReaderOptions) {
    this.canonicalReader = options.canonicalReader;
    this.lastValidReader = options.lastValidReader;
    this.legacyReader = options.legacyReader;
    this.legacyHdhrIdentityReader = options.legacyHdhrIdentityReader;
    this.validator = options.artifactValidator ?? DefaultArtifactValidator;
    this.metrics = options.metrics;
  }

  getXmltv(): Promise<OutputArtifact> {
    return this.requireArtifact('XMLTV');
  }

  getM3u(): Promise<OutputArtifact> {
    return this.requireArtifact('M3U');
  }

  getHdhrDiscovery(): Promise<OutputArtifact> {
    return this.requireArtifact('HDHR_DISCOVERY');
  }

  getHdhrLineup(): Promise<OutputArtifact> {
    return this.requireArtifact('HDHR_LINEUP');
  }

  resolveStreamRoute(
    channelId: Parameters<OutputArtifactReader['resolveStreamRoute']>[0],
  ): Promise<OutputStreamRoute> {
    return this.canonicalReader.resolveStreamRoute(channelId);
  }

  async readArtifact(
    kind: CompatibilityOutputArtifactKind,
  ): Promise<CompatibilityOutputArtifactReadResult> {
    const routePath = routePathForKind(kind);

    const canonical = await this.tryCanonical(kind);

    if (canonical !== undefined) {
      return Object.freeze({
        outcome: 'RESOLVED',
        kind,
        source: 'CANONICAL',
        artifact: canonical,
        routePath,
      });
    }

    const lastValid = await this.tryLastValid(kind);

    if (lastValid !== undefined) {
      this.record('LAST_VALID_OUTPUT_FALLBACKS', kind, 'FALLBACK');

      return Object.freeze({
        outcome: 'RESOLVED',
        kind,
        source: 'LAST_VALID_CANONICAL',
        artifact: lastValid,
        routePath,
      });
    }

    const legacy = await this.tryLegacy(kind);

    if (legacy !== undefined) {
      this.record('LEGACY_OUTPUT_FALLBACKS', kind, 'FALLBACK');

      return Object.freeze({
        outcome: 'RESOLVED',
        kind,
        source: 'LEGACY_FALLBACK',
        artifact: legacy,
        routePath,
      });
    }

    this.record('OUTPUT_ARTIFACT_UNAVAILABLE', kind, 'NOT_FOUND');

    return Object.freeze({
      outcome: 'UNAVAILABLE',
      kind,
      routePath,
      errorCode: 'COMPATIBILITY_UNAVAILABLE',
    });
  }

  async readHdhrIdentity(): Promise<CompatibilityHdhrIdentityReadResult> {
    if (this.legacyHdhrIdentityReader === undefined) {
      this.recordIdentity('NOT_FOUND');

      return Object.freeze({
        outcome: 'UNAVAILABLE',
        errorCode: 'COMPATIBILITY_UNAVAILABLE',
      });
    }

    try {
      const identity =
        await this.legacyHdhrIdentityReader.readLegacyHdhrIdentity();

      if (identity === undefined) {
        this.recordIdentity('NOT_FOUND');

        return Object.freeze({
          outcome: 'UNAVAILABLE',
          errorCode: 'COMPATIBILITY_UNAVAILABLE',
        });
      }

      const preserved = preserveLegacyHdhrIdentity(identity);
      this.recordIdentity('SUCCESS');

      return Object.freeze({
        outcome: 'RESOLVED',
        source: 'LEGACY_PRESERVED',
        identity: preserved,
      });
    } catch {
      this.recordIdentity('FAILURE');

      return Object.freeze({
        outcome: 'UNAVAILABLE',
        errorCode: 'COMPATIBILITY_UNAVAILABLE',
      });
    }
  }

  private async requireArtifact(
    kind: CompatibilityOutputArtifactKind,
  ): Promise<OutputArtifact> {
    const result = await this.readArtifact(kind);

    if (result.outcome === 'UNAVAILABLE') {
      throw new CompatibilityOutputUnavailableError(kind);
    }

    return result.artifact;
  }

  private async tryCanonical(
    kind: CompatibilityOutputArtifactKind,
  ): Promise<OutputArtifact | undefined> {
    try {
      const artifact = await this.readCanonical(kind);

      if (!this.isValid(kind, artifact)) {
        this.record('CANONICAL_READS', kind, 'FAILURE');
        return undefined;
      }

      this.record('CANONICAL_READS', kind, 'SUCCESS');
      return freezeArtifact(artifact);
    } catch {
      this.record('CANONICAL_READS', kind, 'FAILURE');
      return undefined;
    }
  }

  private async tryLastValid(
    kind: CompatibilityOutputArtifactKind,
  ): Promise<OutputArtifact | undefined> {
    if (this.lastValidReader === undefined) {
      return undefined;
    }

    try {
      const artifact = await this.lastValidReader.readLastValidArtifact(kind);

      if (artifact === undefined || !this.isValid(kind, artifact)) {
        return undefined;
      }

      return freezeArtifact(artifact);
    } catch {
      this.record('COMPATIBILITY_ERRORS', kind, 'FAILURE');
      return undefined;
    }
  }

  private async tryLegacy(
    kind: CompatibilityOutputArtifactKind,
  ): Promise<OutputArtifact | undefined> {
    if (this.legacyReader === undefined) {
      return undefined;
    }

    try {
      const artifact = await this.legacyReader.readLegacyArtifact(kind);

      if (artifact === undefined || !this.isValid(kind, artifact)) {
        return undefined;
      }

      return freezeArtifact(artifact);
    } catch {
      this.record('COMPATIBILITY_ERRORS', kind, 'FAILURE');
      return undefined;
    }
  }

  private readCanonical(
    kind: CompatibilityOutputArtifactKind,
  ): Promise<OutputArtifact> {
    switch (kind) {
      case 'XMLTV':
        return this.canonicalReader.getXmltv();
      case 'M3U':
        return this.canonicalReader.getM3u();
      case 'HDHR_DISCOVERY':
        return this.canonicalReader.getHdhrDiscovery();
      case 'HDHR_LINEUP':
        return this.canonicalReader.getHdhrLineup();
    }
  }

  private isValid(
    kind: CompatibilityOutputArtifactKind,
    artifact: OutputArtifact,
  ): boolean {
    try {
      return this.validator.isValidArtifact(kind, artifact);
    } catch {
      return false;
    }
  }

  private record(
    metric: CompatibilityCounterMetric,
    kind: CompatibilityOutputArtifactKind,
    result: CompatibilityMetricResult,
  ): void {
    if (this.metrics === undefined) {
      return;
    }

    const dimensions: CompatibilityMetricDimensions = {
      concept: 'output',
      entityType: 'artifact',
      routeTemplate: routePathForKind(kind),
      operation: operationForKind(kind),
      mode: 'CANONICAL_READ_LEGACY_FALLBACK',
      result,
    };

    try {
      this.metrics.increment(metric, dimensions);
    } catch {
      // Observability cannot change output authority or fallback behavior.
    }
  }

  private recordIdentity(result: CompatibilityMetricResult): void {
    if (this.metrics === undefined) {
      return;
    }

    const dimensions: CompatibilityMetricDimensions = {
      concept: 'output',
      entityType: 'hdhr-device-identity',
      routeTemplate: TunarrOutputCompatibilityRoutePaths.hdhrDevice,
      operation: 'hdhr-identity-read',
      mode: 'LEGACY_ONLY',
      result,
    };

    try {
      this.metrics.increment('HDHR_IDENTITY_READS', dimensions);
    } catch {
      // Observability cannot change identity preservation behavior.
    }
  }
}
