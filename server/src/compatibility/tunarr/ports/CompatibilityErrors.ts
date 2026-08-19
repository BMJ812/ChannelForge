export const CompatibilityErrorCodes = [
  'COMPATIBILITY_UNAVAILABLE',
  'COMPATIBILITY_TRANSLATION_FAILED',
  'COMPATIBILITY_CONFLICT',
  'LEGACY_WRITE_FROZEN',
] as const;

export type CompatibilityErrorCode = (typeof CompatibilityErrorCodes)[number];

export type CompatibilityErrorDescriptor =
  | Readonly<{
      code: 'COMPATIBILITY_UNAVAILABLE';
      retryable: boolean;
    }>
  | Readonly<{
      code: 'COMPATIBILITY_TRANSLATION_FAILED';
      retryable: boolean;
    }>
  | Readonly<{
      code: 'COMPATIBILITY_CONFLICT';
      retryable: false;
      conflictId: string;
    }>
  | Readonly<{
      code: 'LEGACY_WRITE_FROZEN';
      retryable: false;
      replacement?: string;
    }>;
