export const currentMilestone = 2;

export const canonicalModuleDirectories = Object.freeze([
  'access',
  'branding',
  'catalog',
  'channels',
  'health',
  'instance',
  'jobs',
  'media-sources',
  'migration',
  'networks',
  'output',
  'playout',
  'plugins',
  'programming',
  'publication',
  'scheduling',
  'templates',
]);

export const scannedExtensions = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
]);

export const ruleDefinitions = Object.freeze({
  'MOD-001': {
    title: 'Cross-module imports must use public entry points',
    critical: false,
  },
  'MOD-002': {
    title: 'Business modules must not depend on the application host',
    critical: false,
  },
  'MOD-003': {
    title: 'Domain code must not depend on infrastructure or transport',
    critical: false,
  },
  'MOD-004': {
    title: 'Scheduling must not depend on playout, FFmpeg, or process control',
    critical: true,
  },
  'MOD-005': {
    title: 'Playout must not import Programming internals',
    critical: true,
  },
  'MOD-006': {
    title: 'The web application must not import server internals',
    critical: true,
  },
  'MOD-007': {
    title: 'Business modules must not depend on compatibility implementations',
    critical: false,
  },
  'MOD-008': {
    title: 'External callers must not deep-import module internals',
    critical: false,
  },
  'MOD-009': {
    title: 'New modules must not import inherited database internals directly',
    critical: false,
  },
  'STR-001': {
    title: 'Module directories must use an approved canonical name',
    critical: false,
  },
  'STR-002': {
    title: 'Every module directory must expose index.ts',
    critical: false,
  },
  'STR-003': {
    title: 'Every module directory must contain README.md',
    critical: false,
  },
  'STR-004': {
    title: 'Only module directories may exist directly under the modules root',
    critical: false,
  },
  'SHR-001': {
    title: 'Shared package source files must not be deep-imported',
    critical: true,
  },
  'SHR-002': {
    title: 'New modules may import only the governed shared kernel',
    critical: true,
  },
  'SHR-003': {
    title: 'Shared-kernel dependencies must remain pure',
    critical: true,
  },
  'SHR-004': {
    title: 'The shared boundary registry must remain complete and valid',
    critical: false,
    waivable: false,
  },
});

export const sharedKernelAllowedPackages = Object.freeze([
  'lodash-es',
]);

export const sharedKernelTestAllowedPackages = Object.freeze([
  'vitest',
]);

export const forbiddenDomainPackagePrefixes = Object.freeze([
  '@fastify/',
  '@tunarr/playlist',
  'axios',
  'better-sqlite3',
  'child_process',
  'drizzle-orm',
  'fastify',
  'kysely',
  'meilisearch',
  'node:child_process',
]);
