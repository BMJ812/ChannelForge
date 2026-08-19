import type Database from 'better-sqlite3';

import {
  openChannelForgeSqliteConnection,
  type ChannelForgeSqliteConnectionOptions,
} from './ChannelForgeSqliteConnection.js';

export type ChannelForgeSqliteConnectionManagerOptions = Readonly<{
  maxConnections?: number;
  connectionOptions?: ChannelForgeSqliteConnectionOptions;
}>;

export class SqliteConnectionLimitExceededError extends Error {
  constructor(readonly maxConnections: number) {
    super(`ChannelForge SQLite connection limit reached: ${maxConnections}`);

    this.name = 'SqliteConnectionLimitExceededError';
  }
}

function requirePositiveLimit(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError('SQLite maxConnections must be a positive integer');
  }

  return value;
}

export class ChannelForgeSqliteConnectionManager {
  private readonly connections = new Set<Database.Database>();

  private readonly maxConnections: number;

  constructor(
    private readonly filename: string,

    private readonly options: ChannelForgeSqliteConnectionManagerOptions = {},
  ) {
    this.maxConnections = requirePositiveLimit(options.maxConnections ?? 4);
  }

  open(): Database.Database {
    if (this.connections.size >= this.maxConnections) {
      throw new SqliteConnectionLimitExceededError(this.maxConnections);
    }

    const connection = openChannelForgeSqliteConnection(
      this.filename,
      this.options.connectionOptions,
    );

    this.connections.add(connection);

    return connection;
  }

  close(connection: Database.Database): void {
    if (!this.connections.delete(connection)) {
      throw new Error('SQLite connection is not owned by this manager');
    }

    connection.close();
  }

  closeAll(): void {
    for (const connection of this.connections) {
      connection.close();
    }

    this.connections.clear();
  }

  activeCount(): number {
    return this.connections.size;
  }

  limit(): number {
    return this.maxConnections;
  }
}
