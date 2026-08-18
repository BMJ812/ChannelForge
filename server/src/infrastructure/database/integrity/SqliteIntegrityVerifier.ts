import type Database from 'better-sqlite3';

export type SqliteIntegrityStatus = 'PASSED' | 'FAILED';

export type SqliteIntegrityResult = Readonly<{
  status: SqliteIntegrityStatus;
  quickCheck: readonly string[];
  foreignKeyViolations: readonly Readonly<Record<string, unknown>>[];
  errorSummary?: string;
}>;

function normalizeQuickCheck(
  rows: readonly Readonly<Record<string, unknown>>[],
): readonly string[] {
  return Object.freeze(
    rows.flatMap((row) => Object.values(row).map((value) => String(value))),
  );
}

function summarizeFailure(
  quickCheck: readonly string[],
  foreignKeyViolationCount: number,
): string | undefined {
  const quickCheckPassed =
    quickCheck.length === 1 && quickCheck[0]?.toLowerCase() === 'ok';

  if (quickCheckPassed && foreignKeyViolationCount === 0) {
    return undefined;
  }

  const parts: string[] = [];

  if (!quickCheckPassed) {
    parts.push(`quick_check=${JSON.stringify(quickCheck)}`);
  }

  if (foreignKeyViolationCount !== 0) {
    parts.push(`foreign_key_violations=${foreignKeyViolationCount}`);
  }

  return parts.join('; ');
}

export class SqliteIntegrityVerifier {
  constructor(private readonly database: Database.Database) {}

  runQuickCheck(): SqliteIntegrityResult {
    const quickRows = this.database.pragma('quick_check') as Array<
      Readonly<Record<string, unknown>>
    >;

    const foreignKeyViolations = this.database.pragma(
      'foreign_key_check',
    ) as Array<Readonly<Record<string, unknown>>>;

    const quickCheck = normalizeQuickCheck(quickRows);

    const errorSummary = summarizeFailure(
      quickCheck,
      foreignKeyViolations.length,
    );

    return Object.freeze({
      status: errorSummary === undefined ? 'PASSED' : 'FAILED',

      quickCheck,

      foreignKeyViolations: Object.freeze(foreignKeyViolations),

      ...(errorSummary === undefined ? {} : { errorSummary }),
    });
  }
}
