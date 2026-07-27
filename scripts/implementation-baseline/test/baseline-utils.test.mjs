import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDACTED,
  isSensitiveKey,
  redactText,
  redactValue,
} from '../lib/redaction.mjs';
import {
  normalizeRepositoryPath,
  stableStringify,
} from '../lib/stable-json.mjs';
import {
  globToRegExp,
  matchesWorkspacePattern,
  parseWorkspacePackagePatterns,
} from '../lib/workspaces.mjs';

test('stableStringify sorts object keys and preserves array order', () => {
  const output = stableStringify({
    zebra: 1,
    alpha: {
      second: 2,
      first: 1,
    },
    list: ['b', 'a'],
  });

  assert.equal(
    output,
    `{
  "alpha": {
    "first": 1,
    "second": 2
  },
  "list": [
    "b",
    "a"
  ],
  "zebra": 1
}
`,
  );
});

test('normalizeRepositoryPath emits forward-slash relative paths', () => {
  assert.equal(normalizeRepositoryPath('.\\server\\src\\'), 'server/src');
  assert.equal(normalizeRepositoryPath('./web'), 'web');
  assert.equal(normalizeRepositoryPath('.'), '.');
});

test('recognized secret-bearing keys are redacted recursively', () => {
  const result = redactValue({
    apiKey: 'alpha',
    nested: {
      password: 'bravo',
      safe: 'visible',
    },
    tokens: [{ refresh_token: 'charlie' }],
  });

  assert.deepEqual(result, {
    apiKey: REDACTED,
    nested: {
      password: REDACTED,
      safe: 'visible',
    },
    tokens: [{ refresh_token: REDACTED }],
  });

  assert.equal(isSensitiveKey('clientSecret'), true);
  assert.equal(isSensitiveKey('hockeyTeam'), false);
});

test('secret-like values embedded in text are redacted', () => {
  const input = [
    'Authorization: Bearer abc.def.ghi',
    'https://user:password@example.test/path?api_key=abc123',
    'token=plain-text-token',
  ].join('\n');
  const result = redactText(input);

  assert.equal(result.includes('abc.def.ghi'), false);
  assert.equal(result.includes('user:password'), false);
  assert.equal(result.includes('abc123'), false);
  assert.equal(result.includes('plain-text-token'), false);
  assert.match(result, /\[REDACTED\]/);
});

test('workspace package patterns are parsed only from the packages section', () => {
  const patterns = parseWorkspacePackagePatterns(`packages:
  - server
  - "packages/*"

catalog:
  token: should-not-be-read
`);

  assert.deepEqual(patterns, ['packages/*', 'server']);
});

test('workspace glob matching is path-normalized and bounded', () => {
  assert.equal(matchesWorkspacePattern('packages/core', 'packages/*'), true);
  assert.equal(matchesWorkspacePattern('packages/a/b', 'packages/*'), false);
  assert.equal(matchesWorkspacePattern('packages/a/b', 'packages/**'), true);
  assert.equal(matchesWorkspacePattern('server', 'server'), true);
  assert.equal(globToRegExp('web').test('web-extra'), false);
});
