import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  checkArchitecture,
} from '../lib.mjs';

const emptyRegistry = Object.freeze({
  schemaVersion: 1,
  waivers: [],
});

async function writeRepoFile(
  repoRoot,
  relativePath,
  contents = '',
) {
  const fullPath = path.join(
    repoRoot,
    ...relativePath.split('/'),
  );

  await mkdir(path.dirname(fullPath), {
    recursive: true,
  });
  await writeFile(fullPath, contents, 'utf8');
}

async function createModule(
  repoRoot,
  moduleName,
  files = {},
) {
  await writeRepoFile(
    repoRoot,
    `server/src/modules/${moduleName}/index.ts`,
    `export const ${moduleName.replaceAll('-', '_')}Module = true;\n`,
  );
  await writeRepoFile(
    repoRoot,
    `server/src/modules/${moduleName}/README.md`,
    `# ${moduleName}\n`,
  );

  for (const [relativePath, contents] of Object.entries(files)) {
    await writeRepoFile(
      repoRoot,
      `server/src/modules/${moduleName}/${relativePath}`,
      contents,
    );
  }
}

async function withRepository(callback) {
  const repoRoot = await mkdtemp(
    path.join(os.tmpdir(), 'channel-forge-architecture-'),
  );

  try {
    await callback(repoRoot);
  } finally {
    await rm(repoRoot, {
      force: true,
      recursive: true,
    });
  }
}

function ruleIds(result) {
  return result.violations.map(({ ruleId }) => ruleId);
}

test('allows same-module imports', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'catalog', {
      'application/service.ts':
        "import { value } from '../domain/value.js';\n"
        + 'export const service = value;\n',
      'domain/value.ts': 'export const value = 1;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(result.violations, []);
    assert.deepEqual(result.waiverErrors, []);
  });
});

test('allows public cross-module imports', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'catalog');
    await createModule(repoRoot, 'channels', {
      'application/service.ts':
        "import { catalogModule } from '@/modules/catalog';\n"
        + 'export const service = catalogModule;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(result.violations, []);
  });
});

test('rejects cross-module deep imports', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'catalog', {
      'internal/value.ts': 'export const value = 1;\n',
    });
    await createModule(repoRoot, 'channels', {
      'application/service.ts':
        "import { value } from '@/modules/catalog/internal/value.js';\n"
        + 'export const service = value;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['MOD-001']);
  });
});

test('rejects domain-to-infrastructure imports', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/infrastructure/database/client.ts',
      'export const client = true;\n',
    );
    await createModule(repoRoot, 'catalog', {
      'domain/value.ts':
        "import { client } from '@/infrastructure/database/client.js';\n"
        + 'export const value = client;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['MOD-003']);
  });
});

test('rejects scheduling-to-playout imports', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'playout');
    await createModule(repoRoot, 'scheduling', {
      'application/service.ts':
        "import { playoutModule } from '@/modules/playout';\n"
        + 'export const service = playoutModule;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['MOD-004']);
    assert.equal(result.violations[0].critical, true);
  });
});

test('rejects web-to-server imports', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/index.ts',
      'export const server = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'web/src/bad.ts',
      "import { server } from '../../server/src/index.js';\n"
      + 'export const bad = server;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['MOD-006']);
  });
});

test('allows compatibility adapters to use legacy code and public ports', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'catalog');
    await writeRepoFile(
      repoRoot,
      'server/src/db/ProgramDB.ts',
      'export const legacyProgramDb = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'server/src/compatibility/tunarr/catalog-adapter.ts',
      "import { catalogModule } from '@/modules/catalog';\n"
      + "import { legacyProgramDb } from '../../db/ProgramDB.js';\n"
      + 'export const adapter = [catalogModule, legacyProgramDb];\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(result.violations, []);
  });
});

test('allows modules to depend on public compatibility ports', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/compatibility/tunarr/ports/index.ts',
      'export interface LegacyReadPort { read(): string; }\n',
    );

    await createModule(repoRoot, 'instance', {
      'application/service.ts':
        "import type { LegacyReadPort } from '@/compatibility/tunarr/ports';\n"
        + 'export type Port = LegacyReadPort;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(result.violations, []);
  });
});

test('rejects module imports of compatibility implementations', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/compatibility/tunarr/adapters/legacy.ts',
      'export const legacyAdapter = true;\n',
    );

    await createModule(repoRoot, 'instance', {
      'application/service.ts':
        "import { legacyAdapter } from '@/compatibility/tunarr/adapters/legacy.js';\n"
        + 'export const service = legacyAdapter;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['MOD-007']);
  });
});

test('rejects new modules importing inherited server internals directly', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/services/LegacyIdentityService.ts',
      'export const legacyIdentity = true;\n',
    );

    await createModule(repoRoot, 'instance', {
      'application/service.ts':
        "import { legacyIdentity } from '@/services/LegacyIdentityService.js';\n"
        + 'export const service = legacyIdentity;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['CMP-001']);
    assert.equal(result.violations[0].critical, true);
  });
});

test('rejects module database imports with both database and compatibility rules', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/db/SettingsDB.ts',
      'export const legacySettings = true;\n',
    );

    await createModule(repoRoot, 'instance', {
      'application/service.ts':
        "import { legacySettings } from '@/db/SettingsDB.js';\n"
        + 'export const service = legacySettings;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['CMP-001', 'MOD-009']);
    assert.equal(result.violations[0].critical, true);
    assert.equal(result.violations[1].critical, false);
  });
});

test('rejects application-host imports of inherited server internals', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/services/LegacyIdentityService.ts',
      'export const legacyIdentity = true;\n',
    );

    await writeRepoFile(
      repoRoot,
      'server/src/app/bootstrap/service.ts',
      "import { legacyIdentity } from '@/services/LegacyIdentityService.js';\n"
        + 'export const service = legacyIdentity;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['CMP-001']);
  });
});

test('allows compatibility adapters to import inherited database code', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/db/SettingsDB.ts',
      'export const legacySettings = true;\n',
    );

    await writeRepoFile(
      repoRoot,
      'server/src/compatibility/tunarr/adapters/settings.ts',
      "import { legacySettings } from '@/db/SettingsDB.js';\n"
        + 'export const adapter = legacySettings;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(result.violations, []);
  });
});

test('rejects expired waivers', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'catalog', {
      'internal/value.ts': 'export const value = 1;\n',
    });
    await createModule(repoRoot, 'channels', {
      'application/service.ts':
        "import { value } from '@/modules/catalog/internal/value.js';\n"
        + 'export const service = value;\n',
    });

    const result = await checkArchitecture({
      registry: {
        schemaVersion: 1,
        waivers: [{
          expiresMilestone: 'M02',
          id: 'WVR-001',
          import: '@/modules/catalog/internal/value.js',
          owner: 'Channels',
          reason: 'Fixture for expiration validation.',
          ruleId: 'MOD-001',
          source:
            'server/src/modules/channels/application/service.ts',
        }],
      },
      repoRoot,
    });

    assert.equal(
      result.waiverErrors.some(
        ({ code }) => code === 'WAIVER-EXPIRED',
      ),
      true,
    );
  });
});

test('rejects waivers for critical rules', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'playout');
    await createModule(repoRoot, 'scheduling', {
      'application/service.ts':
        "import { playoutModule } from '@/modules/playout';\n"
        + 'export const service = playoutModule;\n',
    });

    const result = await checkArchitecture({
      registry: {
        schemaVersion: 1,
        waivers: [{
          expiresMilestone: 'M03',
          id: 'WVR-002',
          import: '@/modules/playout',
          owner: 'Scheduling',
          reason: 'Fixture for critical-rule validation.',
          ruleId: 'MOD-004',
          source:
            'server/src/modules/scheduling/application/service.ts',
        }],
      },
      repoRoot,
    });

    assert.equal(
      result.waiverErrors.some(
        ({ code }) => code === 'WAIVER-CRITICAL',
      ),
      true,
    );
  });
});

test('rejects non-padded waiver milestones', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'catalog', {
      'internal/value.ts': 'export const value = 1;\n',
    });
    await createModule(repoRoot, 'channels', {
      'application/service.ts':
        "import { value } from '@/modules/catalog/internal/value.js';\n"
        + 'export const service = value;\n',
    });

    const result = await checkArchitecture({
      registry: {
        schemaVersion: 1,
        waivers: [{
          expiresMilestone: 'M3',
          id: 'WVR-003',
          import: '@/modules/catalog/internal/value.js',
          owner: 'Channels',
          reason: 'Fixture for milestone-format validation.',
          ruleId: 'MOD-001',
          source:
            'server/src/modules/channels/application/service.ts',
        }],
      },
      repoRoot,
    });

    assert.equal(
      result.waiverErrors.some(
        ({ code }) => code === 'WAIVER-EXPIRY',
      ),
      true,
    );
  });
});

test('rejects noncanonical module directories', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/modules/misc/index.ts',
      'export const misc = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'server/src/modules/misc/README.md',
      '# misc\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['STR-001']);
  });
});

test('rejects module directories without index.ts', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/modules/catalog/README.md',
      '# catalog\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['STR-002']);
  });
});

test('rejects module directories without README.md', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/modules/catalog/index.ts',
      'export const catalog = true;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['STR-003']);
  });
});

test('rejects files directly under the modules root', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'server/src/modules/catalog.ts',
      'export const catalog = true;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['STR-004']);
  });
});
test('allows new modules to import the governed shared kernel', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'catalog', {
      'domain/value.ts':
        "import { isNonEmptyString } from '@tunarr/shared/kernel';\n"
        + "export const value = isNonEmptyString('catalog');\n",
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(result.violations, []);
  });
});

test('rejects legacy shared imports from new modules', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'catalog', {
      'application/service.ts':
        "import { seq } from '@tunarr/shared/util';\n"
        + 'export const service = seq;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['SHR-002']);
    assert.equal(result.violations[0].critical, true);
  });
});

test('rejects shared package source deep imports', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/src/util/index.ts',
      'export const legacy = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'web/src/bad.ts',
      "import { legacy } from '../../shared/src/util/index.js';\n"
      + 'export const bad = legacy;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['SHR-001']);
    assert.equal(result.violations[0].critical, true);
  });
});

test('allows approved shared-kernel production and test dependencies', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/src/kernel/validation.ts',
      "import { isString } from 'lodash-es';\n"
      + 'export const valid = isString;\n',
    );
    await writeRepoFile(
      repoRoot,
      'shared/src/kernel/validation.test.ts',
      "import { expect } from 'vitest';\n"
      + 'export const assertion = expect;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(result.violations, []);
  });
});

test('rejects legacy and domain dependencies from the shared kernel', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/src/util/index.ts',
      'export const legacy = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'shared/src/kernel/bad.ts',
      "import type { ChannelProgram } from '@tunarr/types';\n"
      + "import { legacy } from '../util/index.js';\n"
      + 'export const bad = [legacy] as const;\n'
      + 'export type BadProgram = ChannelProgram;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['SHR-003', 'SHR-003']);
    assert.equal(
      result.violations.every(({ critical }) => critical),
      true,
    );
  });
});

test('accepts a fully governed shared package export map', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/package.json',
      `${JSON.stringify({
        name: '@tunarr/shared',
        exports: {
          '.': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
          './kernel': {
            types: './dist/src/kernel/index.d.ts',
            default: './dist/src/kernel/index.js',
          },
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'scripts/architecture/shared-boundaries.json',
      `${JSON.stringify({
        schemaVersion: 1,
        package: '@tunarr/shared',
        legacyDeepImportBaseline: [],
        entryPoints: {
          '.': 'legacy-compatibility',
          './kernel': 'kernel',
        },
      }, null, 2)}\n`,
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(result.violations, []);
  });
});

test('rejects package exports missing shared-boundary classifications', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/package.json',
      `${JSON.stringify({
        name: '@tunarr/shared',
        exports: {
          '.': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
          './kernel': {
            types: './dist/src/kernel/index.d.ts',
            default: './dist/src/kernel/index.js',
          },
          './util': {
            types: './dist/src/util/index.d.ts',
            default: './dist/src/util/index.js',
          },
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'scripts/architecture/shared-boundaries.json',
      `${JSON.stringify({
        schemaVersion: 1,
        package: '@tunarr/shared',
        legacyDeepImportBaseline: [],
        entryPoints: {
          '.': 'legacy-compatibility',
          './kernel': 'kernel',
        },
      }, null, 2)}\n`,
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['SHR-004']);
  });
});

test('rejects relative imports from shared build output', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/dist/src/util/index.js',
      'export const legacy = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'web/src/bad.ts',
      "import { legacy } from '../../shared/dist/src/util/index.js';\n"
      + 'export const bad = legacy;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['SHR-001']);
  });
});

test('rejects undeclared shared package subpaths', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/package.json',
      `${JSON.stringify({
        name: '@tunarr/shared',
        exports: {
          '.': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
          './kernel': {
            types: './dist/src/kernel/index.d.ts',
            default: './dist/src/kernel/index.js',
          },
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'scripts/architecture/shared-boundaries.json',
      `${JSON.stringify({
        schemaVersion: 1,
        package: '@tunarr/shared',
        legacyDeepImportBaseline: [],
        entryPoints: {
          '.': 'legacy-compatibility',
          './kernel': 'kernel',
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'web/src/bad.ts',
      "import { value } from '@tunarr/shared/kernel/validation';\n"
      + 'export const bad = value;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['SHR-001']);
  });
});

test('rejects shared deep imports from legacy server code and scripts', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/src/util/index.ts',
      'export const legacy = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'server/src/services/bad.ts',
      "import { legacy } from '../../../shared/src/util/index.js';\n"
      + 'export const bad = legacy;\n',
    );
    await writeRepoFile(
      repoRoot,
      'scripts/bad.mjs',
      "import { legacy } from '../shared/src/util/index.js';\n"
      + 'export const bad = legacy;\n',
    );
    await writeRepoFile(
      repoRoot,
      'server/scripts/bad.ts',
      "import { legacy } from '../../shared/src/util/index.js';\n"
      + 'export const serverScriptBad = legacy;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(
      ruleIds(result),
      ['SHR-001', 'SHR-001', 'SHR-001'],
    );
  });
});

test('rejects shared deep imports from the types workspace', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/src/util/index.ts',
      'export const legacy = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'types/src/bad.ts',
      "import { legacy } from '../../shared/src/util/index.js';\n"
      + 'export const bad = legacy;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['SHR-001']);
  });
});

test('allows only the exact inherited shared deep-import baseline', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/package.json',
      `${JSON.stringify({
        name: '@tunarr/shared',
        exports: {
          '.': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
          './kernel': {
            types: './dist/src/kernel/index.d.ts',
            default: './dist/src/kernel/index.js',
          },
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'scripts/architecture/shared-boundaries.json',
      `${JSON.stringify({
        schemaVersion: 1,
        package: '@tunarr/shared',
        legacyDeepImportBaseline: [{
          import: '../../../shared/dist/src/util/index.js',
          owner: 'Catalog',
          reason: 'Inherited fixture pending consumer migration.',
          removalUnit: 'PR 02F',
          source: 'server/src/db/legacy.ts',
        }],
        entryPoints: {
          '.': 'legacy-compatibility',
          './kernel': 'kernel',
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'shared/dist/src/util/index.js',
      'export const legacy = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'server/src/db/legacy.ts',
      "import { legacy } from '../../../shared/dist/src/util/index.js';\n"
      + 'export const allowed = legacy;\n',
    );
    await writeRepoFile(
      repoRoot,
      'server/src/db/new-deep-import.ts',
      "import { legacy } from '../../../shared/dist/src/util/index.js';\n"
      + 'export const rejected = legacy;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['SHR-001']);
    assert.equal(
      result.violations[0].source,
      'server/src/db/new-deep-import.ts',
    );
  });
});

test('rejects duplicate occurrences of a baselined deep import', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/package.json',
      `${JSON.stringify({
        name: '@tunarr/shared',
        exports: {
          '.': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
          './kernel': {
            types: './dist/src/kernel/index.d.ts',
            default: './dist/src/kernel/index.js',
          },
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'scripts/architecture/shared-boundaries.json',
      `${JSON.stringify({
        schemaVersion: 1,
        package: '@tunarr/shared',
        legacyDeepImportBaseline: [{
          import: '../../../shared/dist/src/util/index.js',
          owner: 'Catalog',
          reason: 'Inherited fixture pending consumer migration.',
          removalUnit: 'PR 02F',
          source: 'server/src/db/legacy.ts',
        }],
        entryPoints: {
          '.': 'legacy-compatibility',
          './kernel': 'kernel',
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'shared/dist/src/util/index.js',
      'export const legacy = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'server/src/db/legacy.ts',
      "import { legacy } from '../../../shared/dist/src/util/index.js';\n"
      + "export const duplicate = import('../../../shared/dist/src/util/index.js');\n"
      + 'export const allowed = legacy;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['SHR-001']);
    assert.equal(
      result.violations[0].source,
      'server/src/db/legacy.ts',
    );
  });
});

test('rejects malformed inherited shared deep-import baselines', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/package.json',
      `${JSON.stringify({
        name: '@tunarr/shared',
        exports: {
          '.': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
          './kernel': {
            types: './dist/src/kernel/index.d.ts',
            default: './dist/src/kernel/index.js',
          },
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'scripts/architecture/shared-boundaries.json',
      `${JSON.stringify({
        schemaVersion: 1,
        package: '@tunarr/shared',
        legacyDeepImportBaseline: [{
          import: '*',
          source: 'server/src/db/legacy.ts',
        }],
        entryPoints: {
          '.': 'legacy-compatibility',
          './kernel': 'kernel',
        },
      }, null, 2)}\n`,
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.equal(
      result.violations.every(({ ruleId }) => ruleId === 'SHR-004'),
      true,
    );
    assert.ok(result.violations.length > 0);
  });
});

test('rejects unused inherited shared deep-import baselines', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'shared/package.json',
      `${JSON.stringify({
        name: '@tunarr/shared',
        exports: {
          '.': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
          './kernel': {
            types: './dist/src/kernel/index.d.ts',
            default: './dist/src/kernel/index.js',
          },
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'scripts/architecture/shared-boundaries.json',
      `${JSON.stringify({
        schemaVersion: 1,
        package: '@tunarr/shared',
        legacyDeepImportBaseline: [{
          import: '../../../shared/dist/src/util/index.js',
          owner: 'Catalog',
          reason: 'Unused fixture.',
          removalUnit: 'PR 02F',
          source: 'server/src/db/missing.ts',
        }],
        entryPoints: {
          '.': 'legacy-compatibility',
          './kernel': 'kernel',
        },
      }, null, 2)}\n`,
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['SHR-004']);
  });
});

test('rejects waivers for explicitly non-waivable rules', async () => {
  await withRepository(async (repoRoot) => {
    const result = await checkArchitecture({
      registry: {
        schemaVersion: 1,
        waivers: [{
          expiresMilestone: 'M03',
          id: 'WVR-SHR-004',
          import: '../../../shared/dist/src/util/index.js',
          owner: 'Catalog',
          reason: 'Fixture for non-waivable registry validation.',
          ruleId: 'SHR-004',
          source: 'server/src/db/legacy.ts',
        }],
      },
      repoRoot,
    });

    assert.equal(
      result.waiverErrors.some(
        ({ code }) => code === 'WAIVER-PROHIBITED',
      ),
      true,
    );
  });
});

test('sorts violations deterministically', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'catalog', {
      'internal/value.ts': 'export const value = 1;\n',
    });
    await createModule(repoRoot, 'channels', {
      'application/zeta.ts':
        "import { value } from '@/modules/catalog/internal/value.js';\n"
        + 'export const zeta = value;\n',
      'application/alpha.ts':
        "import { value } from '@/modules/catalog/internal/value.js';\n"
        + 'export const alpha = value;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(
      result.violations.map(({ source }) => source),
      [
        'server/src/modules/channels/application/alpha.ts',
        'server/src/modules/channels/application/zeta.ts',
      ],
    );
  });
});

test('allows new modules to import the governed public contracts', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'catalog', {
      'domain/value.ts':
        "import '@tunarr/types/contracts';\n"
        + 'export const value = true;\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(result.violations, []);
  });
});

test('rejects inherited Types entry points from new modules', async () => {
  await withRepository(async (repoRoot) => {
    await createModule(repoRoot, 'catalog', {
      'application/service.ts':
        "import type { Channel } from '@tunarr/types';\n"
        + "import type { PagedResult } from '@tunarr/types/api';\n"
        + "import type { ChannelSchema } from '@tunarr/types/schemas';\n"
        + 'export type LegacyContracts = [Channel, PagedResult<unknown>, typeof ChannelSchema];\n',
    });

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(
      ruleIds(result),
      ['TYP-002', 'TYP-002', 'TYP-002'],
    );
    assert.equal(
      result.violations.every(({ critical }) => critical),
      true,
    );
  });
});

test('rejects relative imports into Types source', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'types/src/Program.ts',
      'export const program = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'web/src/bad.ts',
      "import { program } from '../../types/src/Program.js';\n"
      + 'export const bad = program;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['TYP-001']);
  });
});

test('rejects undeclared Types package subpaths', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'types/package.json',
      `${JSON.stringify({
        name: '@tunarr/types',
        exports: {
          '.': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
          './api': {
            types: './dist/src/api/index.d.ts',
            default: './dist/src/api/index.js',
          },
          './contracts': {
            types: './dist/src/contracts/index.d.ts',
            default: './dist/src/contracts/index.js',
          },
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'types/src/contracts/index.ts',
      'export {};\n',
    );
    await writeRepoFile(
      repoRoot,
      'scripts/architecture/types-boundaries.json',
      `${JSON.stringify({
        schemaVersion: 1,
        package: '@tunarr/types',
        entryPoints: {
          '.': 'legacy-compatibility',
          './api': 'legacy-api-contract',
          './contracts': 'public-contract',
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'web/src/bad.ts',
      "import { value } from '@tunarr/types/api/TimeSlots';\n"
      + 'export const bad = value;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['TYP-001']);
  });
});

test('allows approved public-contract production and test dependencies', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'types/src/contracts/schema.ts',
      "import { z } from 'zod';\n"
      + 'export const ContractSchema = z.object({ id: z.string() });\n',
    );
    await writeRepoFile(
      repoRoot,
      'types/src/contracts/schema.test.ts',
      "import { expect } from 'vitest';\n"
      + 'export const assertion = expect;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(result.violations, []);
  });
});
test('rejects legacy, provider, and runtime dependencies from public contracts', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'types/src/Program.ts',
      'export const program = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'types/src/contracts/bad.ts',
      "import { program } from '../Program.js';\n"
      + "import type { PlexMedia } from '@tunarr/types/plex';\n"
      + "import Fastify from 'fastify';\n"
      + 'export const bad = [program, Fastify] as const;\n'
      + 'export type BadProvider = PlexMedia;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(
      ruleIds(result),
      ['TYP-003', 'TYP-003', 'TYP-003'],
    );
    assert.equal(
      result.violations.every(({ critical }) => critical),
      true,
    );
  });
});

test('accepts a fully governed Types package export map', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'types/package.json',
      `${JSON.stringify({
        name: '@tunarr/types',
        exports: {
          '.': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
          './api': {
            types: './dist/src/api/index.d.ts',
            default: './dist/src/api/index.js',
          },
          './contracts': {
            types: './dist/src/contracts/index.d.ts',
            default: './dist/src/contracts/index.js',
          },
          './emby': {
            types: './dist/src/emby/index.d.ts',
            default: './dist/src/emby/index.js',
          },
          './jellyfin': {
            types: './dist/src/jellyfin/index.d.ts',
            default: './dist/src/jellyfin/index.js',
          },
          './package.json': './package.json',
          './plex': {
            types: './dist/src/plex/index.d.ts',
            default: './dist/src/plex/index.js',
          },
          './schemas': {
            types: './dist/src/schemas/index.d.ts',
            default: './dist/src/schemas/index.js',
          },
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'types/src/contracts/index.ts',
      'export {};\n',
    );
    await writeRepoFile(
      repoRoot,
      'scripts/architecture/types-boundaries.json',
      `${JSON.stringify({
        schemaVersion: 1,
        package: '@tunarr/types',
        entryPoints: {
          '.': 'legacy-compatibility',
          './api': 'legacy-api-contract',
          './contracts': 'public-contract',
          './emby': 'provider-payload',
          './jellyfin': 'provider-payload',
          './package.json': 'package-metadata',
          './plex': 'provider-payload',
          './schemas': 'legacy-shared-schema',
        },
      }, null, 2)}\n`,
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(result.violations, []);
  });
});

test('rejects missing Types package classifications', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'types/package.json',
      `${JSON.stringify({
        name: '@tunarr/types',
        exports: {
          '.': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
          './contracts': {
            types: './dist/src/contracts/index.d.ts',
            default: './dist/src/contracts/index.js',
          },
          './schemas': {
            types: './dist/src/schemas/index.d.ts',
            default: './dist/src/schemas/index.js',
          },
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'types/src/contracts/index.ts',
      'export {};\n',
    );
    await writeRepoFile(
      repoRoot,
      'scripts/architecture/types-boundaries.json',
      `${JSON.stringify({
        schemaVersion: 1,
        package: '@tunarr/types',
        entryPoints: {
          '.': 'legacy-compatibility',
          './contracts': 'public-contract',
        },
      }, null, 2)}\n`,
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['TYP-004']);
  });
});

test('rejects a noncanonical public-contract export target', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'types/package.json',
      `${JSON.stringify({
        name: '@tunarr/types',
        exports: {
          '.': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
          './contracts': {
            types: './dist/src/index.d.ts',
            default: './dist/src/index.js',
          },
        },
      }, null, 2)}\n`,
    );
    await writeRepoFile(
      repoRoot,
      'types/src/contracts/index.ts',
      'export {};\n',
    );
    await writeRepoFile(
      repoRoot,
      'scripts/architecture/types-boundaries.json',
      `${JSON.stringify({
        schemaVersion: 1,
        package: '@tunarr/types',
        entryPoints: {
          '.': 'legacy-compatibility',
          './contracts': 'public-contract',
        },
      }, null, 2)}\n`,
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(ruleIds(result), ['TYP-004']);
  });
});

test('rejects Types deep imports from legacy server code and scripts', async () => {
  await withRepository(async (repoRoot) => {
    await writeRepoFile(
      repoRoot,
      'types/src/Program.ts',
      'export const program = true;\n',
    );
    await writeRepoFile(
      repoRoot,
      'server/src/services/bad.ts',
      "import { program } from '../../../types/src/Program.js';\n"
      + 'export const serverBad = program;\n',
    );
    await writeRepoFile(
      repoRoot,
      'scripts/bad.mjs',
      "import { program } from '../types/src/Program.js';\n"
      + 'export const scriptBad = program;\n',
    );
    await writeRepoFile(
      repoRoot,
      'server/scripts/bad.ts',
      "import { program } from '../../types/src/Program.js';\n"
      + 'export const serverScriptBad = program;\n',
    );

    const result = await checkArchitecture({
      registry: emptyRegistry,
      repoRoot,
    });

    assert.deepEqual(
      ruleIds(result),
      ['TYP-001', 'TYP-001', 'TYP-001'],
    );
  });
});

test('rejects waivers for explicitly non-waivable TYP-004', async () => {
  await withRepository(async (repoRoot) => {
    const result = await checkArchitecture({
      registry: {
        schemaVersion: 1,
        waivers: [{
          expiresMilestone: 'M03',
          id: 'WVR-TYP-004',
          import: '@tunarr/types/contracts',
          owner: 'Architecture',
          reason: 'Fixture for non-waivable Types registry validation.',
          ruleId: 'TYP-004',
          source: 'types/package.json',
        }],
      },
      repoRoot,
    });

    assert.equal(
      result.waiverErrors.some(
        ({ code }) => code === 'WAIVER-PROHIBITED',
      ),
      true,
    );
  });
});
