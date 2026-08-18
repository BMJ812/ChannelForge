import { describe, expect, it, vi } from 'vitest';

import {
  createMigrationModule,
  type MigrationCommandService,
  type MigrationQueryService,
} from '../index.js';

describe('Migration module shell', () => {
  it('registers migration coordination services', () => {
    const commands: MigrationCommandService = {
      requestMigration: vi.fn(async () => undefined),
    };

    const queries: MigrationQueryService = {
      getMigrationStatus: vi.fn(async () => ({
        state: 'idle',
      })),
      getCompatibilityUsage: vi.fn(async () => ({})),
    };

    const migration = createMigrationModule({
      commands,
      queries,
    });

    expect(migration.commands).toBe(commands);
    expect(migration.queries).toBe(queries);
    expect(Object.isFrozen(migration)).toBe(true);
  });
});
