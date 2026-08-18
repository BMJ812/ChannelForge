import { migration0001MigrationMetadata } from './0001_migration_metadata.js';
import { migration0002InstanceIdentity } from './0002_instance_identity.js';

export const channelForgeSchemaMigrations = Object.freeze([
  migration0001MigrationMetadata,
  migration0002InstanceIdentity,
]);
