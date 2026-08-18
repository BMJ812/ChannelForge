export type MigrationRunId = string;

export type MigrationState =
  | 'idle'
  | 'ready'
  | 'running'
  | 'blocked'
  | 'completed'
  | 'failed';

export type MigrationStatus = Readonly<{
  state: MigrationState;
  activeRunId?: MigrationRunId;
}>;

export type CompatibilityUsageSummary = Readonly<Record<string, number>>;
