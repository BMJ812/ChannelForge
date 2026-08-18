import type { InstanceId } from './InstanceId.js';

export const InstanceSetupStates = ['INITIALIZING', 'READY'] as const;

export type InstanceSetupState = (typeof InstanceSetupStates)[number];

export type PersistedInstance = Readonly<{
  instanceId: InstanceId;
  displayName: string;
  defaultTimeZone: string;
  setupState: InstanceSetupState;
  schemaVersion: number;
  applicationVersion: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}>;
