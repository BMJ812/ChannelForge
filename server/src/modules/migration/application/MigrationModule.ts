import type {
  CompatibilityUsageSummary,
  MigrationStatus,
} from '../domain/Migration.js';

export interface MigrationCommandService {
  requestMigration(migrationKey: string): Promise<void>;
}

export interface MigrationQueryService {
  getMigrationStatus(): Promise<MigrationStatus>;
  getCompatibilityUsage(): Promise<CompatibilityUsageSummary>;
}

export type MigrationModuleDependencies = Readonly<{
  commands: MigrationCommandService;
  queries: MigrationQueryService;
}>;

export type MigrationModule = Readonly<{
  commands: MigrationCommandService;
  queries: MigrationQueryService;
}>;

export function createMigrationModule(
  dependencies: MigrationModuleDependencies,
): MigrationModule {
  return Object.freeze({
    commands: dependencies.commands,
    queries: dependencies.queries,
  });
}
