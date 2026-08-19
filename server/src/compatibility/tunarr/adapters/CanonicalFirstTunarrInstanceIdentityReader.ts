import type Database from 'better-sqlite3';

import { DBAccess } from '@/db/DBAccess.js';
import type { SettingsDB } from '@/db/SettingsDB.js';
import { SqliteInstanceRepository } from '@/infrastructure/database/repositories/SqliteInstanceRepository.js';
import { SqliteLegacyIdentityMappingRepository } from '@/infrastructure/database/repositories/SqliteLegacyIdentityMappingRepository.js';
import { SqliteLegacyIdentityTombstoneRepository } from '@/infrastructure/database/repositories/SqliteLegacyIdentityTombstoneRepository.js';
import { InstanceId, type InstanceIdentity } from '@/modules/instance/index.js';

import {
  LegacyIdentityResolver,
  type LegacyIdentityResolution,
} from '../identity/index.js';
import type {
  CompatibilityMetricDimensions,
  CompatibilityMetrics,
  CompatibilityReadResult,
} from '../ports/index.js';
import { tunarrRuntimeCompatibilityMetrics } from '../usage/RuntimeCompatibilityMetrics.js';
import { TunarrInstanceIdentityAdapter } from './TunarrInstanceIdentityAdapter.js';

const REQUIRED_CHANNELFORGE_IDENTITY_TABLES = [
  'cf_instance',
  'cf_legacy_identity_mapping',
  'cf_legacy_identity_tombstone',
] as const;

export const InstanceIdentityCompatibilityWarningCodes = [
  'CHANNELFORGE_DATABASE_UNAVAILABLE',
  'CHANNELFORGE_SCHEMA_UNAVAILABLE',
  'CHANNELFORGE_INSTANCE_MISSING',
  'LEGACY_MAPPING_NOT_FOUND',
  'LEGACY_MAPPING_NOT_VERIFIED',
  'LEGACY_MAPPING_INACTIVE',
  'LEGACY_IDENTITY_TOMBSTONED',
  'LEGACY_IDENTITY_CONFLICT',
  'LEGACY_IDENTITY_RESOLUTION_ERROR',
  'TARGET_TYPE_MISMATCH',
  'TARGET_IDENTITY_MISMATCH',
  'CANONICAL_READ_ERROR',
] as const;

export type InstanceIdentityCompatibilityWarningCode =
  (typeof InstanceIdentityCompatibilityWarningCodes)[number];

export type InstanceIdentityCompatibilityReadRequest = Readonly<{
  operation: string;
  routeTemplate?: string;
  applicationVersion?: string;
}>;

export type InstanceIdentityCompatibilityReadResult = Extract<
  CompatibilityReadResult<InstanceIdentity>,
  {
    source: 'CANONICAL' | 'LEGACY_FALLBACK';
  }
>;

export type CanonicalFirstTunarrInstanceIdentityReaderOptions = Readonly<{
  database?: Database.Database | null;
  metrics?: CompatibilityMetrics;
}>;

function requireLabel(label: string, value: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RangeError(`${label} must not be empty`);
  }

  return normalized;
}

function schemaIsAvailable(database: Database.Database): boolean {
  const rows = database
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE
          type = 'table'
          AND name IN (?, ?, ?)
      `,
    )
    .all(...REQUIRED_CHANNELFORGE_IDENTITY_TABLES) as ReadonlyArray<{
    name: string;
  }>;

  const tables = new Set(rows.map((row) => row.name));

  return REQUIRED_CHANNELFORGE_IDENTITY_TABLES.every((table) =>
    tables.has(table),
  );
}

function warningForResolution(
  resolution: Exclude<LegacyIdentityResolution, { kind: 'MAPPED' }>,
): InstanceIdentityCompatibilityWarningCode {
  switch (resolution.kind) {
    case 'TOMBSTONED':
      return 'LEGACY_IDENTITY_TOMBSTONED';

    case 'CONFLICT':
      return 'LEGACY_IDENTITY_CONFLICT';

    case 'ERROR':
      return 'LEGACY_IDENTITY_RESOLUTION_ERROR';

    case 'UNMAPPED':
      switch (resolution.reason) {
        case 'NOT_FOUND':
          return 'LEGACY_MAPPING_NOT_FOUND';

        case 'MAPPING_NOT_VERIFIED':
          return 'LEGACY_MAPPING_NOT_VERIFIED';

        case 'MAPPING_INACTIVE':
          return 'LEGACY_MAPPING_INACTIVE';
      }
  }
}

export class CanonicalFirstTunarrInstanceIdentityReader {
  private readonly database: Database.Database | null;
  private readonly metrics: CompatibilityMetrics;

  constructor(
    private readonly settingsDB: Pick<SettingsDB, 'clientId'>,
    options: CanonicalFirstTunarrInstanceIdentityReaderOptions = {},
  ) {
    this.database =
      options.database === undefined
        ? (DBAccess.instance.getConnection()?.sqlite ?? null)
        : options.database;

    this.metrics = options.metrics ?? tunarrRuntimeCompatibilityMetrics;
  }

  read(
    request: InstanceIdentityCompatibilityReadRequest,
  ): InstanceIdentityCompatibilityReadResult {
    const operation = requireLabel(
      'compatibility operation',
      request.operation,
    );

    const baseDimensions = (
      result: CompatibilityMetricDimensions['result'],
      sourceSchemaVersion?: string,
    ): CompatibilityMetricDimensions =>
      Object.freeze({
        concept: 'instance-identity',
        entityType: 'instance',
        ...(request.routeTemplate === undefined
          ? {}
          : {
              routeTemplate: requireLabel(
                'compatibility route template',
                request.routeTemplate,
              ),
            }),
        operation,
        mode: 'CANONICAL_READ_LEGACY_FALLBACK',
        result,
        ...(request.applicationVersion === undefined
          ? {}
          : {
              applicationVersion: request.applicationVersion,
            }),
        ...(sourceSchemaVersion === undefined
          ? {}
          : {
              sourceSchemaVersion,
            }),
      });

    const legacyReader = new TunarrInstanceIdentityAdapter(this.settingsDB);

    const fallback = (
      warningCode: InstanceIdentityCompatibilityWarningCode,
      legacyIdentity?: InstanceIdentity,
      sourceSchemaVersion?: string,
    ): InstanceIdentityCompatibilityReadResult => {
      const value = legacyIdentity ?? legacyReader.readInstanceIdentity();

      this.metrics.increment(
        'LEGACY_FALLBACK_READS',
        baseDimensions('FALLBACK', sourceSchemaVersion),
      );

      return Object.freeze({
        source: 'LEGACY_FALLBACK',
        value,
        warningCodes: Object.freeze([warningCode]),
      });
    };

    if (this.database === null) {
      return fallback('CHANNELFORGE_DATABASE_UNAVAILABLE');
    }

    try {
      if (!schemaIsAvailable(this.database)) {
        return fallback('CHANNELFORGE_SCHEMA_UNAVAILABLE');
      }

      const instance = new SqliteInstanceRepository(this.database).get();

      if (instance === undefined) {
        return fallback('CHANNELFORGE_INSTANCE_MISSING');
      }

      const sourceSchemaVersion = String(instance.schemaVersion);
      const legacyIdentity = legacyReader.readInstanceIdentity();

      const resolution = new LegacyIdentityResolver(
        new SqliteLegacyIdentityMappingRepository(this.database),
        new SqliteLegacyIdentityTombstoneRepository(this.database),
        this.metrics,
      ).resolve({
        legacy: {
          namespace: 'tunarr',
          entityType: 'instance',
          identifier: legacyIdentity.instanceId,
        },
        concept: 'instance-identity',
        mode: 'CANONICAL_READ_LEGACY_FALLBACK',
        operation,
        ...(request.applicationVersion === undefined
          ? {}
          : {
              applicationVersion: request.applicationVersion,
            }),
        sourceSchemaVersion,
      });

      if (resolution.kind !== 'MAPPED') {
        return fallback(
          warningForResolution(resolution),
          legacyIdentity,
          sourceSchemaVersion,
        );
      }

      this.metrics.increment(
        'SHADOW_COMPARISONS',
        baseDimensions('SUCCESS', sourceSchemaVersion),
      );

      if (resolution.target.entityType !== 'instance') {
        this.metrics.increment(
          'SHADOW_MISMATCHES',
          baseDimensions('FAILURE', sourceSchemaVersion),
        );

        return fallback(
          'TARGET_TYPE_MISMATCH',
          legacyIdentity,
          sourceSchemaVersion,
        );
      }

      const canonicalInstanceId = InstanceId.toString(instance.instanceId);

      if (resolution.target.identifier !== canonicalInstanceId) {
        this.metrics.increment(
          'SHADOW_MISMATCHES',
          baseDimensions('FAILURE', sourceSchemaVersion),
        );

        return fallback(
          'TARGET_IDENTITY_MISMATCH',
          legacyIdentity,
          sourceSchemaVersion,
        );
      }

      this.metrics.increment(
        'CANONICAL_READS',
        baseDimensions('SUCCESS', sourceSchemaVersion),
      );

      return Object.freeze({
        source: 'CANONICAL',
        value: Object.freeze({
          instanceId: canonicalInstanceId,
        }),
        mappingId: resolution.mappingId,
      });
    } catch {
      this.metrics.increment('COMPATIBILITY_ERRORS', baseDimensions('FAILURE'));

      return fallback('CANONICAL_READ_ERROR');
    }
  }
}
