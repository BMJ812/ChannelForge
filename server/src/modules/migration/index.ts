export { createMigrationModule } from './application/MigrationModule.js';

export type {
  MigrationCommandService,
  MigrationModule,
  MigrationModuleDependencies,
  MigrationQueryService,
} from './application/MigrationModule.js';

export type {
  CompatibilityUsageSummary,
  MigrationRunId,
  MigrationState,
  MigrationStatus,
} from './domain/Migration.js';

export {
  BackupId,
  IntegrityCheckId,
} from './domain/PersistenceOperationalIds.js';

export type {
  BackupId as BackupIdentifier,
  IntegrityCheckId as IntegrityCheckIdentifier,
} from './domain/PersistenceOperationalIds.js';
