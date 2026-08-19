import { mkdtempSync, rmSync } from 'node:fs';

import { tmpdir } from 'node:os';

import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  ChannelForgeSqliteConnectionManager,
  SqliteConnectionLimitExceededError,
} from './ChannelForgeSqliteConnectionManager.js';

const directories: string[] = [];

function createFilename(): string {
  const directory = mkdtempSync(join(tmpdir(), 'channelforge-connections-'));

  directories.push(directory);

  return join(directory, 'database.sqlite');
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
});

describe('ChannelForgeSqliteConnectionManager', () => {
  it('enforces a configured connection limit and releases capacity on close', () => {
    const manager = new ChannelForgeSqliteConnectionManager(createFilename(), {
      maxConnections: 2,
    });

    const first = manager.open();

    const second = manager.open();

    expect(manager.activeCount()).toBe(2);

    expect(() => manager.open()).toThrow(SqliteConnectionLimitExceededError);

    manager.close(second);

    expect(manager.activeCount()).toBe(1);

    const replacement = manager.open();

    expect(manager.activeCount()).toBe(2);

    manager.close(replacement);

    manager.close(first);

    expect(manager.activeCount()).toBe(0);
  });

  it('closes all managed connections deterministically', () => {
    const manager = new ChannelForgeSqliteConnectionManager(createFilename(), {
      maxConnections: 2,
    });

    manager.open();
    manager.open();

    manager.closeAll();

    expect(manager.activeCount()).toBe(0);
  });
});
