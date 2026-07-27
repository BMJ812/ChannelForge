import { dirname } from 'node:path';

import { listTrackedPaths, readTrackedJson, readTrackedText } from './git.mjs';
import { compareOrdinal, normalizeRepositoryPath } from './stable-json.mjs';

export function parseWorkspacePackagePatterns(workspaceYaml) {
  const patterns = [];
  let inPackagesSection = false;

  for (const rawLine of String(workspaceYaml)
    .replaceAll('\r\n', '\n')
    .split('\n')) {
    const line = rawLine.replace(/\s+#.*$/, '');

    if (/^packages:\s*$/.test(line)) {
      inPackagesSection = true;
      continue;
    }

    if (inPackagesSection && /^[^\s#][^:]*:\s*/.test(line)) {
      break;
    }

    if (!inPackagesSection) {
      continue;
    }

    const match = /^\s*-\s*(.+?)\s*$/.exec(line);

    if (!match) {
      continue;
    }

    const value = match[1].replace(/^(['"])(.*)\1$/, '$2').trim();

    if (value) {
      patterns.push(normalizeRepositoryPath(value));
    }
  }

  return patterns.sort(compareOrdinal);
}

function escapeRegexCharacter(character) {
  return /[\\^$.*+?()[\]{}|]/.test(character) ? `\\${character}` : character;
}

export function globToRegExp(pattern) {
  const normalized = normalizeRepositoryPath(pattern);
  let expression = '^';

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];

    if (character === '*') {
      const nextCharacter = normalized[index + 1];

      if (nextCharacter === '*') {
        expression += '.*';
        index += 1;
      } else {
        expression += '[^/]*';
      }

      continue;
    }

    if (character === '?') {
      expression += '[^/]';
      continue;
    }

    expression += escapeRegexCharacter(character);
  }

  expression += '$';
  return new RegExp(expression);
}

export function matchesWorkspacePattern(directory, pattern) {
  return globToRegExp(pattern).test(normalizeRepositoryPath(directory));
}

function sortedObjectKeys(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.keys(value).sort(compareOrdinal);
}

function packageSummary(relativePath, packageJson, workspaceNames) {
  const dependencySections = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ];
  const workspaceDependencies = new Set();

  for (const section of dependencySections) {
    for (const dependencyName of sortedObjectKeys(packageJson[section])) {
      if (workspaceNames.has(dependencyName)) {
        workspaceDependencies.add(dependencyName);
      }
    }
  }

  return {
    directWorkspaceDependencies: [...workspaceDependencies].sort(
      compareOrdinal,
    ),
    license: packageJson.license ?? null,
    name: packageJson.name ?? null,
    packageManager: packageJson.packageManager ?? null,
    path: relativePath,
    private: packageJson.private ?? false,
    scriptNames: sortedObjectKeys(packageJson.scripts),
    type: packageJson.type ?? null,
    version: packageJson.version ?? null,
  };
}

export function captureWorkspacePackages(repositoryRoot) {
  const trackedPaths = listTrackedPaths(repositoryRoot);
  const workspaceFile = 'pnpm-workspace.yaml';

  if (!trackedPaths.includes(workspaceFile)) {
    throw new Error(`${workspaceFile} is not tracked.`);
  }

  const patterns = parseWorkspacePackagePatterns(
    readTrackedText(repositoryRoot, workspaceFile),
  );
  const packageJsonPaths = trackedPaths
    .filter((path) => path === 'package.json' || path.endsWith('/package.json'))
    .sort(compareOrdinal);

  const candidatePackages = packageJsonPaths.map((packageJsonPath) => {
    const directory =
      packageJsonPath === 'package.json'
        ? '.'
        : normalizeRepositoryPath(dirname(packageJsonPath));

    return {
      directory,
      packageJson: readTrackedJson(repositoryRoot, packageJsonPath),
    };
  });

  const workspaceCandidates = candidatePackages.filter(({ directory }) =>
    patterns.some((pattern) => matchesWorkspacePattern(directory, pattern)),
  );
  const rootCandidate = candidatePackages.find(
    ({ directory }) => directory === '.',
  );

  if (!rootCandidate) {
    throw new Error('The tracked root package.json was not found.');
  }

  const workspaceNames = new Set(
    workspaceCandidates
      .map(({ packageJson }) => packageJson.name)
      .filter((name) => typeof name === 'string' && name.length > 0),
  );

  return {
    patterns,
    rootPackage: packageSummary('.', rootCandidate.packageJson, workspaceNames),
    workspaceFile,
    workspaces: workspaceCandidates
      .map(({ directory, packageJson }) =>
        packageSummary(directory, packageJson, workspaceNames),
      )
      .sort((left, right) => compareOrdinal(left.path, right.path)),
  };
}
