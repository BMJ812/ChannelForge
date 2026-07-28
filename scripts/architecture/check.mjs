import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';

import {
  checkArchitecture,
  loadWaiverRegistry,
} from './lib.mjs';

const scriptDirectory = path.dirname(
  fileURLToPath(import.meta.url),
);
const repoRoot = path.resolve(scriptDirectory, '../..');
const registryPath = path.join(
  scriptDirectory,
  'waivers.json',
);

const registry = await loadWaiverRegistry(registryPath);
const result = await checkArchitecture({
  registry,
  repoRoot,
});

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  process.stdout.write(
    `Architecture boundary check\n`
    + `Files scanned: ${result.filesScanned}\n`
    + `Active violations: ${result.violations.length}\n`
    + `Waived violations: ${result.waived.length}\n`
    + `Waiver errors: ${result.waiverErrors.length}\n`,
  );

  for (const error of result.waiverErrors) {
    process.stderr.write(
      `\n${error.code}: ${error.message}\n`,
    );
  }

  for (const violation of result.violations) {
    process.stderr.write(
      `\n${violation.ruleId}: ${violation.title}\n`
      + `  Source: ${violation.source}\n`
      + (
        violation.importSpecifier
          ? `  Import: ${violation.importSpecifier}\n`
          : ''
      )
      + `  ${violation.message}\n`,
    );
  }
}

if (
  result.violations.length > 0
  || result.waiverErrors.length > 0
) {
  process.exitCode = 1;
}
