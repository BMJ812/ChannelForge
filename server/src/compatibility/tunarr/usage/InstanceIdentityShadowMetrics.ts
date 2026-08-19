export const InstanceIdentityShadowFindingCodes = [
  'MAPPED_MATCH',
  'MAPPING_MISSING',
  'MAPPING_NOT_VERIFIED',
  'CHANNELFORGE_INSTANCE_MISSING',
  'TARGET_TYPE_MISMATCH',
  'TARGET_IDENTITY_MISMATCH',
] as const;

export type InstanceIdentityShadowFindingCode =
  (typeof InstanceIdentityShadowFindingCodes)[number];

export type InstanceIdentityShadowFinding = Readonly<{
  code: InstanceIdentityShadowFindingCode;
  legacyInstanceId: string;
  channelForgeInstanceId: string | null;
}>;

export type InstanceIdentityShadowSnapshot = Readonly<{
  mappedReads: number;
  legacyFallbacks: number;
  mismatches: number;
  lastFinding: InstanceIdentityShadowFinding | null;
}>;

export class InstanceIdentityShadowMetrics {
  private mappedReads = 0;
  private legacyFallbacks = 0;
  private mismatches = 0;

  private lastFinding: InstanceIdentityShadowFinding | null = null;

  record(
    code: InstanceIdentityShadowFindingCode,
    legacyInstanceId: string,
    channelForgeInstanceId: string | null,
  ): InstanceIdentityShadowFinding {
    const finding = Object.freeze({
      code,
      legacyInstanceId,
      channelForgeInstanceId,
    });

    if (code === 'MAPPED_MATCH') {
      this.mappedReads += 1;
    } else {
      this.legacyFallbacks += 1;

      if (
        code === 'TARGET_TYPE_MISMATCH' ||
        code === 'TARGET_IDENTITY_MISMATCH'
      ) {
        this.mismatches += 1;
      }
    }

    this.lastFinding = finding;

    return finding;
  }

  snapshot(): InstanceIdentityShadowSnapshot {
    return Object.freeze({
      mappedReads: this.mappedReads,
      legacyFallbacks: this.legacyFallbacks,
      mismatches: this.mismatches,
      lastFinding: this.lastFinding,
    });
  }
}
