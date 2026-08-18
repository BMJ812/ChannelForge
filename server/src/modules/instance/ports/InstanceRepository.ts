import type { PersistedInstance } from '../domain/PersistedInstance.js';

export class InstanceAlreadyExistsError extends Error {
  constructor() {
    super('A ChannelForge Instance already exists');

    this.name = 'InstanceAlreadyExistsError';
  }
}

export class InstanceNotFoundError extends Error {
  constructor() {
    super('ChannelForge Instance does not exist');

    this.name = 'InstanceNotFoundError';
  }
}

export class StaleInstanceVersionError extends Error {
  constructor(
    readonly expectedVersion: number,
    readonly actualVersion: number,
  ) {
    super(
      `Stale Instance version: expected ${expectedVersion}, actual ${actualVersion}`,
    );

    this.name = 'StaleInstanceVersionError';
  }
}

export type InstanceUpdate = Readonly<{
  displayName: string;
  defaultTimeZone: string;
  setupState: PersistedInstance['setupState'];
  schemaVersion: number;
  applicationVersion: string;
  updatedAt: string;
}>;

export interface InstanceRepository {
  get(): PersistedInstance | undefined;

  insert(instance: PersistedInstance): void;

  update(update: InstanceUpdate, expectedVersion: number): PersistedInstance;
}
