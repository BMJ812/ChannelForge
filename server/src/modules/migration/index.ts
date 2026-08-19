export {
  LegacyIdentityMappingConflictError,
  LegacyIdentityMappingNotFoundError,
  LegacyIdentityMappingService,
  LegacyIdentityMappingStatusError,
} from './application/LegacyIdentityMappingService.js';

export type {
  EnsureLegacyIdentityMappingRequest,
  LegacyIdentityConflictReason,
} from './application/LegacyIdentityMappingService.js';

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
  LegacyIdentityMappingId,
  LegacyIdentityMappingStatuses,
} from './domain/LegacyIdentityMapping.js';

export type {
  ChannelForgeIdentityReference,
  LegacyIdentityMapping,
  LegacyIdentityMappingId as LegacyIdentityMappingIdentifier,
  LegacyIdentityMappingStatus,
  LegacyIdentityReference,
} from './domain/LegacyIdentityMapping.js';

export {
  BackupId,
  IntegrityCheckId,
} from './domain/PersistenceOperationalIds.js';

export type {
  BackupId as BackupIdentifier,
  IntegrityCheckId as IntegrityCheckIdentifier,
} from './domain/PersistenceOperationalIds.js';

export { LegacyIdentityMappingConstraintError } from './ports/LegacyIdentityMappingRepository.js';

export type { LegacyIdentityMappingRepository } from './ports/LegacyIdentityMappingRepository.js';

export {
  MigrationConflictId,
  MigrationConflictStatuses,
} from './domain/MigrationConflict.js';

export type {
  MigrationConflict,
  MigrationConflictId as MigrationConflictIdentifier,
  MigrationConflictStatus,
} from './domain/MigrationConflict.js';

export type { MigrationConflictRepository } from './ports/MigrationConflictRepository.js';
