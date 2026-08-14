export const TunarrCompatibilityUsageKeys = ['instance-identity-read'] as const;

export type TunarrCompatibilityUsageKey =
  (typeof TunarrCompatibilityUsageKeys)[number];

export type TunarrCompatibilityUsageSnapshot = Readonly<
  Record<TunarrCompatibilityUsageKey, number>
>;

export class TunarrCompatibilityUsageMetrics {
  private readonly counts: Record<TunarrCompatibilityUsageKey, number> = {
    'instance-identity-read': 0,
  };

  record(key: TunarrCompatibilityUsageKey): number {
    const next = this.counts[key] + 1;
    this.counts[key] = next;
    return next;
  }

  snapshot(): TunarrCompatibilityUsageSnapshot {
    return Object.freeze({
      ...this.counts,
    });
  }
}

export const tunarrCompatibilityUsageMetrics =
  new TunarrCompatibilityUsageMetrics();

export function getTunarrCompatibilityUsageSnapshot(): TunarrCompatibilityUsageSnapshot {
  return tunarrCompatibilityUsageMetrics.snapshot();
}
