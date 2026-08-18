import type Database from 'better-sqlite3';

export class NestedTransactionError extends Error {
  constructor() {
    super('Nested ChannelForge transactions are not supported');

    this.name = 'NestedTransactionError';
  }
}

export class SqliteTransactionCoordinator {
  private transactionDepth = 0;

  constructor(private readonly database: Database.Database) {}

  run<T>(operation: () => T): T {
    if (this.transactionDepth !== 0) {
      throw new NestedTransactionError();
    }

    const transaction = this.database.transaction(() => {
      this.transactionDepth += 1;

      try {
        return operation();
      } finally {
        this.transactionDepth -= 1;
      }
    });

    return transaction.immediate();
  }
}
