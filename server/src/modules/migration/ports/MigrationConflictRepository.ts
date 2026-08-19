import type {
  MigrationConflict,
  MigrationConflictId,
} from '../domain/MigrationConflict.js';

export interface MigrationConflictRepository {
  getById(
    migrationConflictId: MigrationConflictId,
  ): MigrationConflict | undefined;

  listOpenByRun(migrationRunId: string): readonly MigrationConflict[];

  insert(conflict: MigrationConflict): void;
}
