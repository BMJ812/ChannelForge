import type { CompatibilityErrorCode } from './CompatibilityErrors.js';

export const CompatibilityWriteStates = [
  'CURRENT',
  'PENDING',
  'DEGRADED',
  'FAILED',
  'CONFLICT',
  'FROZEN',
  'RETIRED',
] as const;

export type CompatibilityWriteState = (typeof CompatibilityWriteStates)[number];

export type CompatibilityWriteStatus =
  | Readonly<{
      state: 'CURRENT';
    }>
  | Readonly<{
      state: 'PENDING';
    }>
  | Readonly<{
      state: 'DEGRADED';
      reconciliationRequired: true;
      errorCode?: CompatibilityErrorCode;
    }>
  | Readonly<{
      state: 'FAILED';
      errorCode: CompatibilityErrorCode;
      retryable: boolean;
    }>
  | Readonly<{
      state: 'CONFLICT';
      conflictId: string;
    }>
  | Readonly<{
      state: 'FROZEN';
      errorCode: 'LEGACY_WRITE_FROZEN';
    }>
  | Readonly<{
      state: 'RETIRED';
    }>;
