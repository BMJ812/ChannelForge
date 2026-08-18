import { InstanceId } from '../domain/InstanceId.js';
import type { PersistedInstance } from '../domain/PersistedInstance.js';
import type { InstanceRepository } from '../ports/InstanceRepository.js';

export type BootstrapInstanceOptions = Readonly<{
  displayName?: string;
  defaultTimeZone?: string;
  schemaVersion: number;
  applicationVersion: string;
  now?: () => Date;
}>;

export function bootstrapInstance(
  repository: InstanceRepository,
  options: BootstrapInstanceOptions,
): PersistedInstance {
  const existing = repository.get();

  if (existing !== undefined) {
    return existing;
  }

  const now = (options.now ?? (() => new Date()))().toISOString();

  const instance: PersistedInstance = Object.freeze({
    instanceId: InstanceId.generate(),

    displayName: options.displayName ?? 'ChannelForge',

    defaultTimeZone: options.defaultTimeZone ?? 'UTC',

    setupState: 'INITIALIZING',

    schemaVersion: options.schemaVersion,

    applicationVersion: options.applicationVersion,

    createdAt: now,
    updatedAt: now,
    version: 1,
  });

  repository.insert(instance);

  return instance;
}
