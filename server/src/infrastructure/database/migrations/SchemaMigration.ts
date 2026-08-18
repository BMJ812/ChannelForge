import { createHash } from 'node:crypto';

export type SchemaMigration = Readonly<{
  id: string;
  name: string;
  statements: readonly string[];
}>;

export function checksumSchemaMigration(migration: SchemaMigration): string {
  const canonical = JSON.stringify({
    id: migration.id,
    name: migration.name,
    statements: migration.statements,
  });

  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
