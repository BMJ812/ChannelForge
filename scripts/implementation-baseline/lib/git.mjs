import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeRepositoryPath } from './stable-json.mjs';
import { redactText } from './redaction.mjs';

function execGit(repositoryRoot, args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', ['-C', repositoryRoot, ...args], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
  } catch (error) {
    if (allowFailure) {
      return '';
    }

    const stderr =
      typeof error?.stderr === 'string' ? error.stderr.trim() : String(error);
    throw new Error(`git ${args.join(' ')} failed: ${stderr}`);
  }
}

export function findRepositoryRoot(startDirectory = process.cwd()) {
  const output = execGit(resolve(startDirectory), [
    'rev-parse',
    '--show-toplevel',
  ]).trim();

  if (!output) {
    throw new Error('Unable to resolve the Git repository root.');
  }

  return resolve(output);
}

export function getRepositoryState(repositoryRoot) {
  const commit = execGit(repositoryRoot, ['rev-parse', 'HEAD']).trim();
  const branch = execGit(
    repositoryRoot,
    ['symbolic-ref', '--quiet', '--short', 'HEAD'],
    { allowFailure: true },
  ).trim();
  const status = execGit(repositoryRoot, [
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
  ]);
  const originRemote = execGit(
    repositoryRoot,
    ['config', '--get', 'remote.origin.url'],
    { allowFailure: true },
  ).trim();

  return {
    branch: branch || null,
    commit,
    dirty: status.length > 0,
    originRemote: originRemote ? redactText(originRemote) : null,
  };
}

export function getGitVersion(repositoryRoot) {
  return execGit(repositoryRoot, ['--version']).trim();
}

export function listTrackedPaths(repositoryRoot) {
  const output = execGit(repositoryRoot, ['ls-files', '-z']);

  return output
    .split('\0')
    .filter(Boolean)
    .map((path) => normalizeRepositoryPath(path))
    .sort();
}

export function listTrackedFileRecords(repositoryRoot) {
  const output = execGit(repositoryRoot, ['ls-files', '--stage', '-z']);
  const records = [];

  for (const record of output.split('\0')) {
    if (!record) {
      continue;
    }

    const match = /^(\d+)\s+([0-9a-f]+)\s+(\d+)\t([\s\S]+)$/i.exec(record);

    if (!match) {
      throw new Error(`Unable to parse git ls-files record: ${record}`);
    }

    records.push({
      mode: match[1],
      objectId: match[2],
      path: normalizeRepositoryPath(match[4]),
      stage: Number.parseInt(match[3], 10),
    });
  }

  records.sort((left, right) => {
    if (left.path < right.path) {
      return -1;
    }

    if (left.path > right.path) {
      return 1;
    }

    return left.stage - right.stage;
  });

  return records;
}

export function readTrackedJson(repositoryRoot, relativePath) {
  const normalizedPath = normalizeRepositoryPath(relativePath);
  const trackedPaths = new Set(listTrackedPaths(repositoryRoot));

  if (!trackedPaths.has(normalizedPath)) {
    throw new Error(`Refusing to read untracked JSON file: ${normalizedPath}`);
  }

  const fullPath = resolve(repositoryRoot, normalizedPath);
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

export function readTrackedText(repositoryRoot, relativePath) {
  const normalizedPath = normalizeRepositoryPath(relativePath);
  const trackedPaths = new Set(listTrackedPaths(repositoryRoot));

  if (!trackedPaths.has(normalizedPath)) {
    throw new Error(`Refusing to read untracked text file: ${normalizedPath}`);
  }

  return readFileSync(resolve(repositoryRoot, normalizedPath), 'utf8');
}
