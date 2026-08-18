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
