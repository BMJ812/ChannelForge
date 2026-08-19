import { createHash } from 'node:crypto';

export type M03PersistenceFixtureManifest = Readonly<{
  fixtureId: string;
  sourceApplicationVersion: string;
  sourceSchemaVersion: number;
  expectedMigrationTarget: number;
  checksum: string;
  sanitizationStatement: string;
  expectedFindings: readonly string[];
}>;

function fixtureChecksum(
  fixtureId: string,
  sourceSchemaVersion: number,
  expectedMigrationTarget: number,
): string {
  return createHash('sha256')
    .update(
      [
        fixtureId,
        sourceSchemaVersion,
        expectedMigrationTarget,
        'synthetic-v1',
      ].join(':'),
      'utf8',
    )
    .digest('hex');
}

function createFixture(
  fixtureId: string,
  sourceSchemaVersion: number,
  expectedMigrationTarget: number,
  expectedFindings: readonly string[] = [],
): M03PersistenceFixtureManifest {
  return Object.freeze({
    fixtureId,

    sourceApplicationVersion: 'synthetic',

    sourceSchemaVersion,

    expectedMigrationTarget,

    checksum: fixtureChecksum(
      fixtureId,
      sourceSchemaVersion,
      expectedMigrationTarget,
    ),

    sanitizationStatement:
      'Synthetic fixture only; contains no user, provider, credential, or private media data.',

    expectedFindings: Object.freeze([...expectedFindings]),
  });
}

export const m03PersistenceFixtures = Object.freeze([
  createFixture('empty-install', 0, 5),

  createFixture('persisted-instance', 5, 5),

  createFixture('verified-legacy-instance-mapping', 5, 5),

  createFixture('restored-verified-backup', 5, 5),
]);
