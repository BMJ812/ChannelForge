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
