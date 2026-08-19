export type CompatibilityReadResult<T> =
  | Readonly<{
      source: 'CANONICAL';
      value: T;
      mappingId?: string;
    }>
  | Readonly<{
      source: 'LEGACY_FALLBACK';
      value: T;
      mappingId?: string;
      warningCodes: readonly string[];
    }>
  | Readonly<{
      source: 'CONFLICT';
      conflictId: string;
    }>
  | Readonly<{
      source: 'NOT_FOUND';
    }>;

export function isCompatibilityReadValue<T>(
  result: CompatibilityReadResult<T>,
): result is Extract<
  CompatibilityReadResult<T>,
  {
    source: 'CANONICAL' | 'LEGACY_FALLBACK';
  }
> {
  return result.source === 'CANONICAL' || result.source === 'LEGACY_FALLBACK';
}
