import Database from 'better-sqlite3';

export const DEFAULT_SQLITE_BUSY_TIMEOUT_MS = 5_000;

export const ChannelForgeJournalModes = ['wal', 'delete'] as const;

export type ChannelForgeJournalMode = (typeof ChannelForgeJournalModes)[number];

export type ChannelForgeSqliteConnectionOptions = Readonly<{
  busyTimeoutMs?: number;
  journalMode?: ChannelForgeJournalMode;
}>;

function validateBusyTimeout(busyTimeoutMs: number): number {
  if (!Number.isInteger(busyTimeoutMs) || busyTimeoutMs < 0) {
    throw new RangeError('SQLite busy timeout must be a non-negative integer');
  }

  return busyTimeoutMs;
}

export function openChannelForgeSqliteConnection(
  filename: string,
  options: ChannelForgeSqliteConnectionOptions = {},
): Database.Database {
  const busyTimeoutMs = validateBusyTimeout(
    options.busyTimeoutMs ?? DEFAULT_SQLITE_BUSY_TIMEOUT_MS,
  );

  const journalMode = options.journalMode ?? 'wal';

  const database = new Database(filename);

  try {
    database.pragma('foreign_keys = ON');
    database.pragma(`busy_timeout = ${busyTimeoutMs}`);

    const appliedJournalMode = String(
      database.pragma(`journal_mode = ${journalMode}`, {
        simple: true,
      }),
    ).toLowerCase();

    if (appliedJournalMode !== journalMode) {
      throw new Error(
        `SQLite journal mode mismatch: requested ${journalMode}, received ${appliedJournalMode}`,
      );
    }

    const foreignKeys = Number(
      database.pragma('foreign_keys', {
        simple: true,
      }),
    );

    if (foreignKeys !== 1) {
      throw new Error('SQLite foreign-key enforcement could not be verified');
    }

    const appliedBusyTimeout = Number(
      database.pragma('busy_timeout', {
        simple: true,
      }),
    );

    if (appliedBusyTimeout !== busyTimeoutMs) {
      throw new Error(
        `SQLite busy timeout mismatch: requested ${busyTimeoutMs}, received ${appliedBusyTimeout}`,
      );
    }

    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}
