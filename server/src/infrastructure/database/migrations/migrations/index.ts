import { migration0001MigrationMetadata } from './0001_migration_metadata.js';
import { migration0002InstanceIdentity } from './0002_instance_identity.js';
import { migration0003BackupIntegrity } from './0003_backup_integrity.js';
import { migration0004LegacyIdentityMapping } from './0004_legacy_identity_mapping.js';
import { migration0005OperationalSafety } from './0005_operational_safety.js';
import { migration0006LegacyIdentityTombstone } from './0006_legacy_identity_tombstone.js';
import { migration0007CompatibilityStatus } from './0007_compatibility_status.js';
import { migration0008CompatibilityReconciliation } from './0008_compatibility_reconciliation.js';

export const channelForgeSchemaMigrations = Object.freeze([
  migration0001MigrationMetadata,
  migration0002InstanceIdentity,
  migration0003BackupIntegrity,
  migration0004LegacyIdentityMapping,
  migration0005OperationalSafety,
  migration0006LegacyIdentityTombstone,
  migration0007CompatibilityStatus,
  migration0008CompatibilityReconciliation,
]);
