#!/usr/bin/env node

import process from 'node:process';

import {
  findRepositoryRoot,
  getGitVersion,
  getRepositoryState,
  listTrackedFileRecords,
  readTrackedJson,
} from './lib/git.mjs';
import { redactValue } from './lib/redaction.mjs';
import { stableStringify } from './lib/stable-json.mjs';
import { captureWorkspacePackages } from './lib/workspaces.mjs';

const allowedCommands = new Set([
  'all',
  'repository',
  'tracked-files',
  'workspaces',
]);

function printHelp() {
  process.stdout.write(`ChannelForge Milestone 01 baseline capture

Usage:
  node scripts/implementation-baseline/capture.mjs <command> [--compact]

Commands:
  all            Capture repository, workspace, and tracked-file metadata.
  repository     Capture repository and toolchain metadata.
  workspaces     Capture root and workspace package metadata.
  tracked-files  Capture Git object metadata for tracked files.

Properties:
  - Reads tracked repository metadata only.
  - Does not write inside the repository.
  - Does not read environment files or credential stores.
  - Redacts recognized secret-bearing keys and text patterns.
  - Emits deterministically ordered JSON.
  - Omits timestamps and absolute repository paths.
`);
}

function parseArguments(argv) {
  const command = argv.find((argument) => !argument.startsWith('-')) ?? 'all';
  const compact = argv.includes('--compact');
  const help = argv.includes('--help') || argv.includes('-h');

  const unknownOptions = argv.filter(
    (argument) =>
      argument.startsWith('-') &&
      !['--compact', '--help', '-h'].includes(argument),
  );

  if (unknownOptions.length > 0) {
    throw new Error(`Unknown option: ${unknownOptions.join(', ')}`);
  }

  if (!allowedCommands.has(command)) {
    throw new Error(`Unknown command: ${command}`);
  }

  return { command, compact, help };
}

function rootPackageSummary(repositoryRoot) {
  const packageJson = readTrackedJson(repositoryRoot, 'package.json');

  return {
    engines: packageJson.engines ?? null,
    license: packageJson.license ?? null,
    name: packageJson.name ?? null,
    packageManager: packageJson.packageManager ?? null,
    scriptNames: Object.keys(packageJson.scripts ?? {}).sort(),
    type: packageJson.type ?? null,
    version: packageJson.version ?? null,
  };
}

function captureRepository(repositoryRoot) {
  return {
    capture: 'repository',
    rootPackage: rootPackageSummary(repositoryRoot),
    schemaVersion: 1,
    source: getRepositoryState(repositoryRoot),
    toolchain: {
      architecture: process.arch,
      git: getGitVersion(repositoryRoot),
      node: process.version,
      platform: process.platform,
    },
  };
}

function captureTrackedFiles(repositoryRoot) {
  const files = listTrackedFileRecords(repositoryRoot);

  return {
    capture: 'tracked-files',
    files,
    schemaVersion: 1,
    summary: {
      conflictedEntryCount: files.filter((file) => file.stage !== 0).length,
      trackedEntryCount: files.length,
    },
  };
}

function captureWorkspaces(repositoryRoot) {
  return {
    capture: 'workspaces',
    schemaVersion: 1,
    ...captureWorkspacePackages(repositoryRoot),
  };
}

function captureAll(repositoryRoot) {
  return {
    capture: 'all',
    repository: captureRepository(repositoryRoot),
    schemaVersion: 1,
    trackedFiles: captureTrackedFiles(repositoryRoot),
    workspaces: captureWorkspaces(repositoryRoot),
  };
}

function main() {
  const { command, compact, help } = parseArguments(process.argv.slice(2));

  if (help) {
    printHelp();
    return;
  }

  const repositoryRoot = findRepositoryRoot();
  const captures = {
    all: captureAll,
    repository: captureRepository,
    'tracked-files': captureTrackedFiles,
    workspaces: captureWorkspaces,
  };
  const payload = redactValue(captures[command](repositoryRoot));

  process.stdout.write(stableStringify(payload, { compact }));
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Baseline capture failed: ${message}\n`);
  process.exitCode = 1;
}
