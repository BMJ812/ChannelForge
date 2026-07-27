import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import test from 'node:test';

const repositoryRoot = resolve(
  fileURLToPath(new URL('../../../', import.meta.url)),
);
const captureScript = resolve(
  repositoryRoot,
  'scripts/implementation-baseline/capture.mjs',
);

function runCapture(command = 'all') {
  return execFileSync(process.execPath, [captureScript, command], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    windowsHide: true,
  });
}

function repositoryStatus() {
  return execFileSync(
    'git',
    ['-C', repositoryRoot, 'status', '--porcelain=v1', '--untracked-files=all'],
    {
      encoding: 'utf8',
      windowsHide: true,
    },
  );
}

test('all capture is byte-for-byte stable for unchanged repository state', () => {
  const first = runCapture('all');
  const second = runCapture('all');

  assert.equal(second, first);
});

test('all capture is valid JSON with required sections', () => {
  const output = runCapture('all');
  const payload = JSON.parse(output);

  assert.equal(payload.capture, 'all');
  assert.equal(payload.schemaVersion, 1);
  assert.match(payload.repository.source.commit, /^[0-9a-f]{40}$/);
  assert.equal(Array.isArray(payload.trackedFiles.files), true);
  assert.equal(Array.isArray(payload.workspaces.workspaces), true);

  const workspaceNames = payload.workspaces.workspaces.map(
    (workspace) => workspace.name,
  );

  assert.deepEqual(workspaceNames.sort(), [
    '@tunarr/server',
    '@tunarr/shared',
    '@tunarr/types',
    '@tunarr/web',
  ]);
});

test('capture omits the absolute repository path', () => {
  const output = runCapture('all');
  const normalizedRoot = repositoryRoot.replaceAll('\\', '/');

  assert.equal(output.replaceAll('\\', '/').includes(normalizedRoot), false);
});

test('capture does not alter repository status', () => {
  const before = repositoryStatus();

  runCapture('repository');
  runCapture('workspaces');
  runCapture('tracked-files');

  const after = repositoryStatus();
  assert.equal(after, before);
});
