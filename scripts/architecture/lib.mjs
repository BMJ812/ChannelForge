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
  ruleDefinitions,
  scannedExtensions,
} from './rules.mjs';

const canonicalModuleSet = new Set(canonicalModuleDirectories);

const strictSourceRoots = Object.freeze([
  'server/src/modules',
  'server/src/app',
  'server/src/infrastructure',
  'server/src/compatibility',
  'server/src/transport',
  'web/src',
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

function packageNameFromSpecifier(specifier) {
  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/');
  }

  return specifier.split('/')[0];
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

  return violations;
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

  const violations = await scanModuleStructure(repoRoot);

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
        repoRoot,
        sourceInfo,
        specifier,
      }));
    }
  }

  violations.sort(compareViolations);

  if (waiverErrors.length > 0) {
    return {
      filesScanned: sourceFiles.length,
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
    filesScanned: sourceFiles.length,
    violations: active,
    waived,
    waiverErrors: unusedWaiverErrors,
  };
}

export async function loadWaiverRegistry(filePath) {
  const contents = await readFile(filePath, 'utf8');

  return JSON.parse(contents);
}
