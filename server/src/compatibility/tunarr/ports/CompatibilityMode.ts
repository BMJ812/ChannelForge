export const CompatibilityModes = [
  'LEGACY_ONLY',
  'LEGACY_READ_CANONICAL_WRITE',
  'CANONICAL_READ_LEGACY_FALLBACK',
  'CANONICAL_ONLY',
  'DUAL_COMPARE',
  'TEMPORARY_WRITE_TRANSLATION',
  'FROZEN_LEGACY_WRITE',
  'RETIRED',
] as const;

export type CompatibilityMode = (typeof CompatibilityModes)[number];

export function isCompatibilityMode(
  value: unknown,
): value is CompatibilityMode {
  return (
    typeof value === 'string' &&
    (CompatibilityModes as readonly string[]).includes(value)
  );
}
