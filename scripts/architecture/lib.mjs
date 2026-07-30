import {
  access,
  readFile,
  readdir,
} from 'node:fs/promises';
import path from 'node:path';

import ts from 'typescript';

import {
  canonicalModuleDirectories,
  currentMilestone,
  forbiddenDomainPackagePrefixes,
  publicContractAllowedPackages,
  publicContractTestAllowedPackages,
  ruleDefinitions,
  scannedExtensions,
  sharedKernelAllowedPackages,
  sharedKernelTestAllowedPackages,
} from './rules.mjs';

const canonicalModuleSet = new Set(canonicalModuleDirectories);

const strictSourceRoots = Object.freeze([
  'server/src/modules',
  'server/src/app',
  'server/src/infrastructure',
  'server/src/compatibility',
  'server/src/transport',
  'shared/src',
  'types/src',
  'web/src',
]);

const sharedOnlySourceRoots = Object.freeze([
  'server/scripts',
  'server/src',
  'scripts',
]);

const typesOnlySourceRoots = Object.freeze([
  'server/scripts',
  'server/src',
  'scripts',
]);

const sourceExtensionPattern = /\.(?:[cm]?[jt]sx?)$/u;

export function toPosix(value) {
  return value.replaceAll(path.sep, '/');
}

function normalizeRelativePath(value) {
  const normalized = path.posix.normalize(toPosix(value));

  if (normalized === '.') {
    return '';
  }

  return normalized.replace(/^\.\//u, '');
}

function stripSourceExtension(value) {
  return value.replace(sourceExtensionPattern, '');
}

function isTestSourcePath(relativePath) {
  return /(?:^|\/).+\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(relativePath);
}

function packageNameFromSpecifier(specifier) {
  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/');
  }

  return specifier.split('/')[0];
}

function sharedPackageSpecifierFromEntryPoint(entryPoint) {
  if (entryPoint === '.') {
    return '@tunarr/shared';
  }

  if (entryPoint.startsWith('./')) {
    return `@tunarr/shared/${entryPoint.slice(2)}`;
  }

  return null;
}

function isSharedSourceCategory(category) {
  return [
    'shared-kernel',
    'shared-legacy',
  ].includes(category);
}

function typesPackageSpecifierFromEntryPoint(entryPoint) {
  if (entryPoint === '.') {
    return '@tunarr/types';
  }

  if (entryPoint.startsWith('./')) {
    return `@tunarr/types/${entryPoint.slice(2)}`;
  }

  return null;
}

function isTypesSourceCategory(category) {
  return [
    'types-contracts',
    'types-legacy',
  ].includes(category);
}

function sharedDeepImportBaselineKey(source, specifier) {
  return `${source}\u0000${specifier}`;
}

function isSharedBoundaryImport({
  declaredSharedPackageSpecifiers,
  specifier,
  targetInfo,
}) {
  const targetPath = targetInfo.relativePath;
  const targetsSharedInternals =
    targetPath === 'shared/src'
    || targetPath?.startsWith('shared/src/')
    || targetPath === 'shared/dist'
    || targetPath?.startsWith('shared/dist/');
  const explicitlyTargetsSharedInternals =
    specifier === '@tunarr/shared/src'
    || specifier.startsWith('@tunarr/shared/src/')
    || specifier === '@tunarr/shared/dist'
    || specifier.startsWith('@tunarr/shared/dist/');
  const targetsSharedPackage =
    specifier === '@tunarr/shared'
    || specifier.startsWith('@tunarr/shared/');
  const targetsUndeclaredSharedEntry =
    targetsSharedPackage
    && declaredSharedPackageSpecifiers instanceof Set
    && !declaredSharedPackageSpecifiers.has(specifier);

  return (
    targetsSharedInternals
    || explicitlyTargetsSharedInternals
    || targetsUndeclaredSharedEntry
  );
}

function isTypesBoundaryImport({
  declaredTypesPackageSpecifiers,
  specifier,
  targetInfo,
}) {
  const targetPath = targetInfo.relativePath;
  const targetsTypesInternals =
    targetPath === 'types/src'
    || targetPath?.startsWith('types/src/')
    || targetPath === 'types/dist'
    || targetPath?.startsWith('types/dist/')
    || targetPath === 'types/build'
    || targetPath?.startsWith('types/build/');
  const explicitlyTargetsTypesInternals =
    specifier === '@tunarr/types/src'
    || specifier.startsWith('@tunarr/types/src/')
    || specifier === '@tunarr/types/dist'
    || specifier.startsWith('@tunarr/types/dist/')
    || specifier === '@tunarr/types/build'
    || specifier.startsWith('@tunarr/types/build/');
  const targetsTypesPackage =
    specifier === '@tunarr/types'
    || specifier.startsWith('@tunarr/types/');
  const targetsUndeclaredTypesEntry =
    targetsTypesPackage
    && declaredTypesPackageSpecifiers instanceof Set
    && !declaredTypesPackageSpecifiers.has(specifier);

  return (
    targetsTypesInternals
    || explicitlyTargetsTypesInternals
    || targetsUndeclaredTypesEntry
  );
}

async function pathExists(value) {
  try {
    await access(value);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(directory) {
  if (!(await pathExists(directory))) {
    return [];
  }

  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name))) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walkFiles(fullPath));
      continue;
    }

    if (
      entry.isFile()
      && scannedExtensions.has(path.extname(entry.name))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function classifyRelativePath(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  const parts = normalized.split('/');

  if (
    parts[0] === 'shared'
    && parts[1] === 'src'
  ) {
    return {
      category:
        parts[2] === 'kernel'
          ? 'shared-kernel'
          : 'shared-legacy',
      layer: parts[3] ?? null,
      module: null,
      relativePath: normalized,
    };
  }

  if (
    parts[0] === 'types'
    && [
      'build',
      'dist',
      'src',
    ].includes(parts[1])
  ) {
    return {
      category:
        parts[1] === 'src'
        && parts[2] === 'contracts'
          ? 'types-contracts'
          : 'types-legacy',
      layer: parts[3] ?? null,
      module: null,
      relativePath: normalized,
    };
  }

  if (
    parts[0] === 'server'
    && parts[1] === 'src'
    && parts[2] === 'modules'
    && parts[3]
  ) {
    return {
      category: 'module',
      layer: parts[4] ?? null,
      module: parts[3],
      relativePath: normalized,
    };
  }

  const serverCategory = parts[2];

  if (
    parts[0] === 'server'
    && parts[1] === 'src'
    && [
      'app',
      'compatibility',
      'infrastructure',
      'transport',
    ].includes(serverCategory)
  ) {
    return {
      category: serverCategory,
      layer: null,
      module: null,
      relativePath: normalized,
    };
  }

  if (parts[0] === 'server' && parts[1] === 'src') {
    return {
      category: 'legacy-server',
      layer: null,
      module: null,
      relativePath: normalized,
    };
  }

  if (parts[0] === 'web' && parts[1] === 'src') {
    return {
      category: 'web',
      layer: null,
      module: null,
      relativePath: normalized,
    };
  }

  return {
    category: 'other',
    layer: null,
    module: null,
    relativePath: normalized,
  };
}

function resolveImport(
  repoRoot,
  sourceInfo,
  sourceRelativePath,
  specifier,
) {
  if (specifier.startsWith('@/')) {
    const aliasRoot =
      sourceInfo.category === 'web'
        ? 'web/src'
        : 'server/src';

    const relativePath = normalizeRelativePath(
      path.posix.join(
        aliasRoot,
        specifier.slice(2),
      ),
    );

    return {
      kind: 'internal',
      ...classifyRelativePath(relativePath),
      isPublicModuleEntry: isPublicModuleEntry(relativePath),
    };
  }

  if (
    specifier.startsWith('./')
    || specifier.startsWith('../')
  ) {
    const relativePath = normalizeRelativePath(
      path.posix.join(
        path.posix.dirname(sourceRelativePath),
        specifier,
      ),
    );

    return {
      kind: 'internal',
      ...classifyRelativePath(relativePath),
      isPublicModuleEntry: isPublicModuleEntry(relativePath),
    };
  }

  if (
    specifier.startsWith('server/src/')
    || specifier.startsWith('shared/src/')
    || specifier.startsWith('shared/dist/')
    || specifier.startsWith('types/src/')
    || specifier.startsWith('types/dist/')
    || specifier.startsWith('types/build/')
    || specifier.startsWith('web/src/')
  ) {
    const relativePath = normalizeRelativePath(specifier);

    return {
      kind: 'internal',
      ...classifyRelativePath(relativePath),
      isPublicModuleEntry: isPublicModuleEntry(relativePath),
    };
  }

  return {
    category: 'package',
    isPublicModuleEntry: false,
    kind: 'package',
    layer: null,
    module: null,
    packageName: packageNameFromSpecifier(specifier),
    relativePath: null,
    repoRoot,
  };
}

function isPublicModuleEntry(relativePath) {
  const withoutExtension = stripSourceExtension(
    normalizeRelativePath(relativePath),
  );

  const match = withoutExtension.match(
    /^server\/src\/modules\/([^/]+)(?:\/index)?$/u,
  );

  return match !== null;
}

function collectImportSpecifiers(sourceText, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );

  const imports = [];

  const addStringLiteral = (node) => {
    if (node && ts.isStringLiteralLike(node)) {
      imports.push(node.text);
    }
  };

  const visit = (node) => {
    if (
      ts.isImportDeclaration(node)
      || ts.isExportDeclaration(node)
    ) {
      addStringLiteral(node.moduleSpecifier);
    } else if (
      ts.isImportEqualsDeclaration(node)
      && ts.isExternalModuleReference(node.moduleReference)
    ) {
      addStringLiteral(node.moduleReference.expression);
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport =
        node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire =
        ts.isIdentifier(node.expression)
        && node.expression.text === 'require';

      if (isDynamicImport || isRequire) {
        addStringLiteral(node.arguments[0]);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return imports;
}

function createViolation({
  critical,
  importSpecifier = null,
  message,
  ruleId,
  source,
  target = null,
}) {
  return {
    critical,
    importSpecifier,
    message,
    ruleId,
    source,
    target,
    title: ruleDefinitions[ruleId].title,
  };
}

function evaluateImport({
  declaredSharedPackageSpecifiers,
  declaredTypesPackageSpecifiers,
  repoRoot,
  sourceInfo,
  specifier,
}) {
  const violations = [];
  const targetInfo = resolveImport(
    repoRoot,
    sourceInfo,
    sourceInfo.relativePath,
    specifier,
  );

  const add = (ruleId, message) => {
    violations.push(createViolation({
      critical: ruleDefinitions[ruleId].critical,
      importSpecifier: specifier,
      message,
      ruleId,
      source: sourceInfo.relativePath,
      target: targetInfo.relativePath
        ?? targetInfo.packageName
        ?? specifier,
    }));
  };

  if (
    sourceInfo.category === 'module'
    && targetInfo.category === 'module'
    && sourceInfo.module !== targetInfo.module
  ) {
    if (
      sourceInfo.module === 'scheduling'
      && targetInfo.module === 'playout'
    ) {
      add(
        'MOD-004',
        'Scheduling may not depend on the Playout module.',
      );
    } else if (
      sourceInfo.module === 'playout'
      && targetInfo.module === 'programming'
      && !targetInfo.isPublicModuleEntry
    ) {
      add(
        'MOD-005',
        'Playout may not import Programming internals.',
      );
    } else if (!targetInfo.isPublicModuleEntry) {
      add(
        'MOD-001',
        'Cross-module imports must target the other module public index.',
      );
    }
  }

  if (
    sourceInfo.category === 'module'
    && targetInfo.category === 'app'
  ) {
    add(
      'MOD-002',
      'A business module may not import the application host.',
    );
  }

  if (
    sourceInfo.category === 'module'
    && sourceInfo.layer === 'domain'
  ) {
    const forbiddenInternalTarget = [
      'app',
      'compatibility',
      'infrastructure',
      'transport',
    ].includes(targetInfo.category);

    const forbiddenPackage =
      targetInfo.kind === 'package'
      && forbiddenDomainPackagePrefixes.some((prefix) =>
        specifier === prefix
        || specifier.startsWith(`${prefix}/`));

    if (forbiddenInternalTarget || forbiddenPackage) {
      add(
        'MOD-003',
        'Domain code may not depend on infrastructure, transport, host, or prohibited runtime packages.',
      );
    }
  }

  if (
    sourceInfo.category === 'module'
    && sourceInfo.module === 'scheduling'
  ) {
    const processOrFfmpeg =
      specifier.includes('ffmpeg')
      || specifier === 'child_process'
      || specifier === 'node:child_process'
      || targetInfo.category === 'infrastructure'
        && targetInfo.relativePath?.startsWith(
          'server/src/infrastructure/process',
        );

    if (
      processOrFfmpeg
      && !violations.some(({ ruleId }) => ruleId === 'MOD-004')
    ) {
      add(
        'MOD-004',
        'Scheduling may not depend on FFmpeg or process-control infrastructure.',
      );
    }
  }

  if (
    sourceInfo.category === 'web'
    && (
      targetInfo.relativePath?.startsWith('server/src/')
      || specifier === '@tunarr/server'
      || specifier.startsWith('@tunarr/server/')
    )
  ) {
    add(
      'MOD-006',
      'The web application may not import server internals.',
    );
  }

  if (
    sourceInfo.category === 'module'
    && targetInfo.category === 'compatibility'
  ) {
    add(
      'MOD-007',
      'Business modules may not depend on compatibility implementations.',
    );
  }

  if (
    sourceInfo.category !== 'module'
    && targetInfo.category === 'module'
    && !targetInfo.isPublicModuleEntry
  ) {
    add(
      'MOD-008',
      'Callers outside a module must use its public index.',
    );
  }

  if (
    sourceInfo.category === 'module'
    && targetInfo.relativePath?.startsWith('server/src/db/')
  ) {
    add(
      'MOD-009',
      'New modules may not import inherited database internals directly.',
    );
  }

  const sourceIsShared = isSharedSourceCategory(sourceInfo.category);
  const sharedInternalImport =
    !sourceIsShared
    && isSharedBoundaryImport({
      declaredSharedPackageSpecifiers,
      specifier,
      targetInfo,
    });

  if (sharedInternalImport) {
    add(
      'SHR-001',
      'Callers outside @tunarr/shared must use a declared package entry point.',
    );
  }

  const sharedPackageImport =
    specifier === '@tunarr/shared'
    || specifier.startsWith('@tunarr/shared/');

  if (
    sourceInfo.category === 'module'
    && sharedPackageImport
    && specifier !== '@tunarr/shared/kernel'
    && !sharedInternalImport
  ) {
    add(
      'SHR-002',
      'New ChannelForge modules may import @tunarr/shared/kernel only.',
    );
  }

  if (sourceInfo.category === 'shared-kernel') {
    const packageAllowed =
      targetInfo.kind !== 'package'
      || sharedKernelAllowedPackages.includes(targetInfo.packageName)
      || (
        isTestSourcePath(sourceInfo.relativePath)
        && sharedKernelTestAllowedPackages.includes(targetInfo.packageName)
      );
    const internalTargetAllowed =
      targetInfo.kind !== 'internal'
      || targetInfo.category === 'shared-kernel';

    if (!packageAllowed || !internalTargetAllowed) {
      add(
        'SHR-003',
        'The shared kernel may depend only on kernel files and approved neutral packages.',
      );
    }
  }

  const sourceIsTypes = isTypesSourceCategory(sourceInfo.category);
  const typesInternalImport =
    !sourceIsTypes
    && isTypesBoundaryImport({
      declaredTypesPackageSpecifiers,
      specifier,
      targetInfo,
    });

  if (typesInternalImport) {
    add(
      'TYP-001',
      'Callers outside @tunarr/types must use a declared package entry point.',
    );
  }

  const typesPackageImport =
    specifier === '@tunarr/types'
    || specifier.startsWith('@tunarr/types/');

  if (
    sourceInfo.category === 'module'
    && typesPackageImport
    && specifier !== '@tunarr/types/contracts'
    && !typesInternalImport
  ) {
    add(
      'TYP-002',
      'New ChannelForge modules may import @tunarr/types/contracts only.',
    );
  }

  if (sourceInfo.category === 'types-contracts') {
    const packageAllowed =
      targetInfo.kind !== 'package'
      || publicContractAllowedPackages.includes(targetInfo.packageName)
      || (
        isTestSourcePath(sourceInfo.relativePath)
        && publicContractTestAllowedPackages.includes(targetInfo.packageName)
      );
    const internalTargetAllowed =
      targetInfo.kind !== 'internal'
      || targetInfo.category === 'types-contracts';

    if (!packageAllowed || !internalTargetAllowed) {
      add(
        'TYP-003',
        'Public contracts may depend only on contract files and approved schema packages.',
      );
    }
  }

  return violations;
}

async function scanSharedPackageBoundary(repoRoot) {
  const manifestPath = path.join(
    repoRoot,
    'shared',
    'package.json',
  );

  if (!(await pathExists(manifestPath))) {
    return [];
  }

  const registryPath = path.join(
    repoRoot,
    'scripts',
    'architecture',
    'shared-boundaries.json',
  );
  const violations = [];
  const add = (message, source = 'scripts/architecture/shared-boundaries.json') => {
    violations.push(createViolation({
      critical: ruleDefinitions['SHR-004'].critical,
      message,
      ruleId: 'SHR-004',
      source,
    }));
  };

  let manifest;

  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    add('shared/package.json must contain valid JSON.', 'shared/package.json');
    return violations;
  }

  if (!(await pathExists(registryPath))) {
    add('The shared export-classification registry is missing.');
    return violations;
  }

  let registry;

  try {
    registry = JSON.parse(await readFile(registryPath, 'utf8'));
  } catch {
    add('The shared export-classification registry must contain valid JSON.');
    return violations;
  }

  if (registry.schemaVersion !== 1) {
    add('The shared export-classification schemaVersion must be 1.');
  }

  if (registry.package !== '@tunarr/shared') {
    add('The shared export-classification registry must target @tunarr/shared.');
  }

  if (
    !registry.entryPoints
    || typeof registry.entryPoints !== 'object'
    || Array.isArray(registry.entryPoints)
  ) {
    add('The shared export-classification registry must contain an entryPoints object.');
    return violations;
  }

  if (!Array.isArray(registry.legacyDeepImportBaseline)) {
    add('The shared boundary registry must contain a legacyDeepImportBaseline array.');
    return violations;
  }

  const baselineKeys = new Set();

  for (const [index, entry] of registry.legacyDeepImportBaseline.entries()) {
    const label = `legacyDeepImportBaseline[${index}]`;

    if (
      !entry
      || typeof entry !== 'object'
      || Array.isArray(entry)
    ) {
      add(`${label} must be an object.`);
      continue;
    }

    for (const field of [
      'import',
      'owner',
      'reason',
      'removalUnit',
      'source',
    ]) {
      if (
        typeof entry[field] !== 'string'
        || entry[field].trim() === ''
      ) {
        add(`${label}.${field} must be a non-empty string.`);
      }
    }

    for (const field of ['source', 'import']) {
      if (
        typeof entry[field] === 'string'
        && /[*?]/u.test(entry[field])
      ) {
        add(`${label}.${field} must identify an exact value.`);
      }
    }

    if (
      typeof entry.removalUnit === 'string'
      && !/^PR \d{2}[A-Z]$/u.test(entry.removalUnit)
    ) {
      add(`${label}.removalUnit must use the form PR NNA.`);
    }

    if (
      typeof entry.source === 'string'
      && typeof entry.import === 'string'
    ) {
      const key = sharedDeepImportBaselineKey(
        entry.source,
        entry.import,
      );

      if (baselineKeys.has(key)) {
        add(`${label} duplicates an existing source and import pair.`);
      }

      baselineKeys.add(key);
    }
  }

  const manifestExports =
    manifest.exports
    && typeof manifest.exports === 'object'
    && !Array.isArray(manifest.exports)
      ? manifest.exports
      : {};
  const manifestEntries = Object.keys(manifestExports).sort();
  const registryEntries = Object.keys(registry.entryPoints).sort();
  const allowedClassifications = new Set([
    'kernel',
    'legacy-compatibility',
  ]);

  for (const entry of manifestEntries) {
    if (!(entry in registry.entryPoints)) {
      add(`Package export "${entry}" is missing a classification.`);
      continue;
    }

    const classification = registry.entryPoints[entry];
    const expectedClassification =
      entry === './kernel'
        ? 'kernel'
        : 'legacy-compatibility';

    if (!allowedClassifications.has(classification)) {
      add(`Package export "${entry}" has unknown classification "${classification}".`);
    } else if (classification !== expectedClassification) {
      add(
        `Package export "${entry}" must be classified "${expectedClassification}".`,
      );
    }
  }

  for (const entry of registryEntries) {
    if (!(entry in manifestExports)) {
      add(`Classification "${entry}" does not match a package export.`);
    }
  }

  const kernelExport = manifestExports['./kernel'];

  if (!kernelExport) {
    add('The governed ./kernel package export is missing.', 'shared/package.json');
  } else if (
    kernelExport.types !== './dist/src/kernel/index.d.ts'
    || kernelExport.default !== './dist/src/kernel/index.js'
  ) {
    add(
      'The ./kernel export must target the canonical kernel declaration and runtime entry points.',
      'shared/package.json',
    );
  }

  return violations;
}

async function scanTypesPackageBoundary(repoRoot) {
  const manifestPath = path.join(
    repoRoot,
    'types',
    'package.json',
  );

  if (!(await pathExists(manifestPath))) {
    return [];
  }

  const registryPath = path.join(
    repoRoot,
    'scripts',
    'architecture',
    'types-boundaries.json',
  );
  const violations = [];
  const add = (
    message,
    source = 'scripts/architecture/types-boundaries.json',
  ) => {
    violations.push(createViolation({
      critical: ruleDefinitions['TYP-004'].critical,
      message,
      ruleId: 'TYP-004',
      source,
    }));
  };

  let manifest;

  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    add('types/package.json must contain valid JSON.', 'types/package.json');
    return violations;
  }

  if (!(await pathExists(registryPath))) {
    add('The Types export-classification registry is missing.');
    return violations;
  }

  let registry;

  try {
    registry = JSON.parse(await readFile(registryPath, 'utf8'));
  } catch {
    add('The Types export-classification registry must contain valid JSON.');
    return violations;
  }

  if (registry.schemaVersion !== 1) {
    add('The Types export-classification schemaVersion must be 1.');
  }

  if (registry.package !== '@tunarr/types') {
    add('The Types export-classification registry must target @tunarr/types.');
  }

  if (
    !registry.entryPoints
    || typeof registry.entryPoints !== 'object'
    || Array.isArray(registry.entryPoints)
  ) {
    add('The Types export-classification registry must contain an entryPoints object.');
    return violations;
  }

  const manifestExports =
    manifest.exports
    && typeof manifest.exports === 'object'
    && !Array.isArray(manifest.exports)
      ? manifest.exports
      : {};
  const manifestEntries = Object.keys(manifestExports).sort();
  const registryEntries = Object.keys(registry.entryPoints).sort();
  const expectedClassifications = Object.freeze({
    '.': 'legacy-compatibility',
    './api': 'legacy-api-contract',
    './contracts': 'public-contract',
    './emby': 'provider-payload',
    './jellyfin': 'provider-payload',
    './package.json': 'package-metadata',
    './plex': 'provider-payload',
    './schemas': 'legacy-shared-schema',
  });
  const allowedClassifications = new Set(
    Object.values(expectedClassifications),
  );

  for (const entry of manifestEntries) {
    if (!(entry in registry.entryPoints)) {
      add(`Package export "${entry}" is missing a classification.`);
      continue;
    }

    const classification = registry.entryPoints[entry];
    const expectedClassification = expectedClassifications[entry];

    if (!allowedClassifications.has(classification)) {
      add(
        `Package export "${entry}" has unknown classification "${classification}".`,
      );
    } else if (!expectedClassification) {
      add(
        `Package export "${entry}" has no approved Types classification.`,
      );
    } else if (classification !== expectedClassification) {
      add(
        `Package export "${entry}" must be classified "${expectedClassification}".`,
      );
    }
  }

  for (const entry of registryEntries) {
    if (!(entry in manifestExports)) {
      add(`Classification "${entry}" does not match a package export.`);
    }
  }

  const contractsExport = manifestExports['./contracts'];

  if (!contractsExport) {
    add(
      'The governed ./contracts package export is missing.',
      'types/package.json',
    );
  } else if (
    contractsExport.types !== './dist/src/contracts/index.d.ts'
    || contractsExport.default !== './dist/src/contracts/index.js'
  ) {
    add(
      'The ./contracts export must target the canonical contract declaration and runtime entry points.',
      'types/package.json',
    );
  }

  if (!(await pathExists(path.join(
    repoRoot,
    'types',
    'src',
    'contracts',
    'index.ts',
  )))) {
    add(
      'The governed public-contract source entry point is missing.',
      'types/src/contracts/index.ts',
    );
  }

  return violations;
}

async function loadDeclaredSharedPackageSpecifiers(repoRoot) {
  const registryPath = path.join(
    repoRoot,
    'scripts',
    'architecture',
    'shared-boundaries.json',
  );

  if (!(await pathExists(registryPath))) {
    return null;
  }

  let registry;

  try {
    registry = JSON.parse(await readFile(registryPath, 'utf8'));
  } catch {
    return null;
  }

  if (
    !registry.entryPoints
    || typeof registry.entryPoints !== 'object'
    || Array.isArray(registry.entryPoints)
  ) {
    return null;
  }

  return new Set(
    Object.keys(registry.entryPoints)
      .map(sharedPackageSpecifierFromEntryPoint)
      .filter((specifier) => specifier !== null),
  );
}

async function loadDeclaredTypesPackageSpecifiers(repoRoot) {
  const registryPath = path.join(
    repoRoot,
    'scripts',
    'architecture',
    'types-boundaries.json',
  );

  if (!(await pathExists(registryPath))) {
    return null;
  }

  let registry;

  try {
    registry = JSON.parse(await readFile(registryPath, 'utf8'));
  } catch {
    return null;
  }

  if (
    !registry.entryPoints
    || typeof registry.entryPoints !== 'object'
    || Array.isArray(registry.entryPoints)
  ) {
    return null;
  }

  return new Set(
    Object.keys(registry.entryPoints)
      .map(typesPackageSpecifierFromEntryPoint)
      .filter((specifier) => specifier !== null),
  );
}

async function loadSharedDeepImportBaseline(repoRoot) {
  const registryPath = path.join(
    repoRoot,
    'scripts',
    'architecture',
    'shared-boundaries.json',
  );

  if (!(await pathExists(registryPath))) {
    return new Map();
  }

  let registry;

  try {
    registry = JSON.parse(await readFile(registryPath, 'utf8'));
  } catch {
    return new Map();
  }

  if (!Array.isArray(registry.legacyDeepImportBaseline)) {
    return new Map();
  }

  return new Map(
    registry.legacyDeepImportBaseline
      .filter((entry) =>
        typeof entry?.source === 'string'
        && typeof entry?.import === 'string')
      .map((entry) => [
        sharedDeepImportBaselineKey(entry.source, entry.import),
        entry,
      ]),
  );
}

async function scanAdditionalSharedImportSources({
  declaredSharedPackageSpecifiers,
  repoRoot,
  sharedDeepImportBaseline,
}) {
  const usedBaseline = new Set();
  const violations = [];
  let filesScanned = 0;

  for (const relativeRoot of sharedOnlySourceRoots) {
    const files = await walkFiles(
      path.join(
        repoRoot,
        ...relativeRoot.split('/'),
      ),
    );

    for (const filePath of files) {
      const relativePath = normalizeRelativePath(
        path.relative(repoRoot, filePath),
      );
      const sourceInfo = classifyRelativePath(relativePath);
      const isLegacyServer = sourceInfo.category === 'legacy-server';
      const isScript =
        relativePath.startsWith('scripts/')
        || relativePath.startsWith('server/scripts/');

      if (!isLegacyServer && !isScript) {
        continue;
      }

      filesScanned += 1;

      const sourceText = await readFile(filePath, 'utf8');

      for (const specifier of collectImportSpecifiers(
        sourceText,
        relativePath,
      )) {
        const targetInfo = resolveImport(
          repoRoot,
          sourceInfo,
          relativePath,
          specifier,
        );

        if (!isSharedBoundaryImport({
          declaredSharedPackageSpecifiers,
          specifier,
          targetInfo,
        })) {
          continue;
        }

        const baselineKey = sharedDeepImportBaselineKey(
          relativePath,
          specifier,
        );

        if (
          sharedDeepImportBaseline.has(baselineKey)
          && !usedBaseline.has(baselineKey)
        ) {
          usedBaseline.add(baselineKey);
          continue;
        }

        violations.push(createViolation({
          critical: ruleDefinitions['SHR-001'].critical,
          importSpecifier: specifier,
          message:
            'Callers outside @tunarr/shared must use a declared package entry point.',
          ruleId: 'SHR-001',
          source: relativePath,
          target:
            targetInfo.relativePath
            ?? targetInfo.packageName
            ?? specifier,
        }));
      }
    }
  }

  for (const [key, baseline] of sharedDeepImportBaseline) {
    if (usedBaseline.has(key)) {
      continue;
    }

    violations.push(createViolation({
      critical: ruleDefinitions['SHR-004'].critical,
      importSpecifier: baseline.import,
      message:
        'An inherited shared deep-import baseline entry is unused and must be removed.',
      ruleId: 'SHR-004',
      source: baseline.source,
      target: baseline.import,
    }));
  }

  return {
    filesScanned,
    violations,
  };
}

async function scanAdditionalTypesImportSources({
  declaredTypesPackageSpecifiers,
  repoRoot,
}) {
  const violations = [];
  let filesScanned = 0;

  for (const relativeRoot of typesOnlySourceRoots) {
    const files = await walkFiles(
      path.join(
        repoRoot,
        ...relativeRoot.split('/'),
      ),
    );

    for (const filePath of files) {
      const relativePath = normalizeRelativePath(
        path.relative(repoRoot, filePath),
      );
      const sourceInfo = classifyRelativePath(relativePath);
      const isLegacyServer = sourceInfo.category === 'legacy-server';
      const isScript =
        relativePath.startsWith('scripts/')
        || relativePath.startsWith('server/scripts/');

      if (!isLegacyServer && !isScript) {
        continue;
      }

      filesScanned += 1;

      const sourceText = await readFile(filePath, 'utf8');

      for (const specifier of collectImportSpecifiers(
        sourceText,
        relativePath,
      )) {
        const targetInfo = resolveImport(
          repoRoot,
          sourceInfo,
          relativePath,
          specifier,
        );

        if (!isTypesBoundaryImport({
          declaredTypesPackageSpecifiers,
          specifier,
          targetInfo,
        })) {
          continue;
        }

        violations.push(createViolation({
          critical: ruleDefinitions['TYP-001'].critical,
          importSpecifier: specifier,
          message:
            'Callers outside @tunarr/types must use a declared package entry point.',
          ruleId: 'TYP-001',
          source: relativePath,
          target:
            targetInfo.relativePath
            ?? targetInfo.packageName
            ?? specifier,
        }));
      }
    }
  }

  return {
    filesScanned,
    violations,
  };
}

async function scanModuleStructure(repoRoot) {
  const modulesRoot = path.join(
    repoRoot,
    'server',
    'src',
    'modules',
  );

  if (!(await pathExists(modulesRoot))) {
    return [];
  }

  const entries = await readdir(modulesRoot, {
    withFileTypes: true,
  });

  const violations = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) {
      violations.push(createViolation({
        critical: false,
        message:
          'Only module directories may exist directly under server/src/modules.',
        ruleId: 'STR-004',
        source: `server/src/modules/${entry.name}`,
      }));
      continue;
    }

    const moduleName = entry.name;
    const source = `server/src/modules/${moduleName}`;

    if (!canonicalModuleSet.has(moduleName)) {
      violations.push(createViolation({
        critical: false,
        message:
          `Module directory "${moduleName}" is not in the canonical M02 module set.`,
        ruleId: 'STR-001',
        source,
      }));
    }

    if (!(await pathExists(path.join(
      modulesRoot,
      moduleName,
      'index.ts',
    )))) {
      violations.push(createViolation({
        critical: false,
        message: 'A module directory must expose index.ts.',
        ruleId: 'STR-002',
        source,
      }));
    }

    if (!(await pathExists(path.join(
      modulesRoot,
      moduleName,
      'README.md',
    )))) {
      violations.push(createViolation({
        critical: false,
        message: 'A module directory must contain README.md.',
        ruleId: 'STR-003',
        source,
      }));
    }
  }

  return violations;
}

function milestoneNumber(value) {
  const match = /^M(\d{2})$/u.exec(value);

  return match ? Number.parseInt(match[1], 10) : null;
}

export function validateWaiverRegistry(registry) {
  const errors = [];

  if (
    !registry
    || typeof registry !== 'object'
    || Array.isArray(registry)
  ) {
    return [{
      code: 'WAIVER-REGISTRY',
      message: 'The waiver registry must be an object.',
    }];
  }

  if (registry.schemaVersion !== 1) {
    errors.push({
      code: 'WAIVER-SCHEMA',
      message: 'The waiver registry schemaVersion must be 1.',
    });
  }

  if (!Array.isArray(registry.waivers)) {
    errors.push({
      code: 'WAIVER-REGISTRY',
      message: 'The waiver registry must contain a waivers array.',
    });

    return errors;
  }

  const ids = new Set();

  for (const [index, waiver] of registry.waivers.entries()) {
    const label = `waivers[${index}]`;

    for (const field of [
      'expiresMilestone',
      'id',
      'import',
      'owner',
      'reason',
      'ruleId',
      'source',
    ]) {
      if (
        typeof waiver?.[field] !== 'string'
        || waiver[field].trim() === ''
      ) {
        errors.push({
          code: 'WAIVER-FIELD',
          message: `${label}.${field} must be a non-empty string.`,
        });
      }
    }

    if (typeof waiver?.id === 'string') {
      if (ids.has(waiver.id)) {
        errors.push({
          code: 'WAIVER-DUPLICATE',
          message: `Duplicate waiver id: ${waiver.id}`,
        });
      }

      ids.add(waiver.id);
    }

    if (
      typeof waiver?.ruleId === 'string'
      && !ruleDefinitions[waiver.ruleId]
    ) {
      errors.push({
        code: 'WAIVER-RULE',
        message: `${label} references unknown rule ${waiver.ruleId}.`,
      });
    }

    if (
      typeof waiver?.ruleId === 'string'
      && ruleDefinitions[waiver.ruleId]?.critical
    ) {
      errors.push({
        code: 'WAIVER-CRITICAL',
        message: `${waiver.ruleId} is critical and cannot be waived.`,
      });
    }

    if (
      typeof waiver?.ruleId === 'string'
      && ruleDefinitions[waiver.ruleId]?.waivable === false
    ) {
      errors.push({
        code: 'WAIVER-PROHIBITED',
        message: `${waiver.ruleId} is explicitly non-waivable.`,
      });
    }

    for (const field of ['source', 'import']) {
      if (
        typeof waiver?.[field] === 'string'
        && /[*?]/u.test(waiver[field])
      ) {
        errors.push({
          code: 'WAIVER-WILDCARD',
          message: `${label}.${field} must identify an exact value.`,
        });
      }
    }

    if (typeof waiver?.expiresMilestone === 'string') {
      const expires = milestoneNumber(
        waiver.expiresMilestone,
      );

      if (expires === null) {
        errors.push({
          code: 'WAIVER-EXPIRY',
          message:
            `${label}.expiresMilestone must use MNN format.`,
        });
      } else if (expires <= currentMilestone) {
        errors.push({
          code: 'WAIVER-EXPIRED',
          message:
            `${waiver.id ?? label} expired at ${waiver.expiresMilestone}.`,
        });
      }
    }
  }

  return errors;
}

function applyWaivers(violations, registry) {
  const used = new Set();
  const active = [];
  const waived = [];

  for (const violation of violations) {
    const waiver = registry.waivers.find((candidate) =>
      candidate.ruleId === violation.ruleId
      && candidate.source === violation.source
      && candidate.import === violation.importSpecifier);

    if (!waiver) {
      active.push(violation);
      continue;
    }

    used.add(waiver.id);
    waived.push({
      ...violation,
      waiverId: waiver.id,
    });
  }

  const unusedWaiverErrors = registry.waivers
    .filter(({ id }) => !used.has(id))
    .map(({ id }) => ({
      code: 'WAIVER-UNUSED',
      message: `Waiver ${id} does not match a current violation.`,
    }));

  return {
    active,
    unusedWaiverErrors,
    waived,
  };
}

function compareViolations(left, right) {
  return [
    left.ruleId,
    left.source,
    left.importSpecifier ?? '',
    left.message,
  ].join('\u0000').localeCompare([
    right.ruleId,
    right.source,
    right.importSpecifier ?? '',
    right.message,
  ].join('\u0000'));
}

export async function checkArchitecture({
  registry = {
    schemaVersion: 1,
    waivers: [],
  },
  repoRoot,
}) {
  const waiverErrors = validateWaiverRegistry(registry);

  const sourceFiles = [];

  for (const relativeRoot of strictSourceRoots) {
    const files = await walkFiles(
      path.join(
        repoRoot,
        ...relativeRoot.split('/'),
      ),
    );

    sourceFiles.push(...files);
  }

  const declaredSharedPackageSpecifiers =
    await loadDeclaredSharedPackageSpecifiers(repoRoot);
  const declaredTypesPackageSpecifiers =
    await loadDeclaredTypesPackageSpecifiers(repoRoot);
  const sharedDeepImportBaseline =
    await loadSharedDeepImportBaseline(repoRoot);
  const additionalSharedImportScan =
    await scanAdditionalSharedImportSources({
      declaredSharedPackageSpecifiers,
      repoRoot,
      sharedDeepImportBaseline,
    });
  const additionalTypesImportScan =
    await scanAdditionalTypesImportSources({
      declaredTypesPackageSpecifiers,
      repoRoot,
    });
  const violations = [
    ...await scanModuleStructure(repoRoot),
    ...await scanSharedPackageBoundary(repoRoot),
    ...await scanTypesPackageBoundary(repoRoot),
    ...additionalSharedImportScan.violations,
    ...additionalTypesImportScan.violations,
  ];

  for (const filePath of sourceFiles) {
    const relativePath = normalizeRelativePath(
      path.relative(repoRoot, filePath),
    );

    const sourceInfo = classifyRelativePath(relativePath);
    const sourceText = await readFile(filePath, 'utf8');

    for (const specifier of collectImportSpecifiers(
      sourceText,
      relativePath,
    )) {
      violations.push(...evaluateImport({
        declaredSharedPackageSpecifiers,
        declaredTypesPackageSpecifiers,
        repoRoot,
        sourceInfo,
        specifier,
      }));
    }
  }

  violations.sort(compareViolations);

  if (waiverErrors.length > 0) {
    return {
      filesScanned:
        sourceFiles.length
        + additionalSharedImportScan.filesScanned
        + additionalTypesImportScan.filesScanned,
      violations,
      waived: [],
      waiverErrors,
    };
  }

  const {
    active,
    unusedWaiverErrors,
    waived,
  } = applyWaivers(violations, registry);

  return {
    filesScanned:
        sourceFiles.length
        + additionalSharedImportScan.filesScanned
        + additionalTypesImportScan.filesScanned,
    violations: active,
    waived,
    waiverErrors: unusedWaiverErrors,
  };
}

export async function loadWaiverRegistry(filePath) {
  const contents = await readFile(filePath, 'utf8');

  return JSON.parse(contents);
}
