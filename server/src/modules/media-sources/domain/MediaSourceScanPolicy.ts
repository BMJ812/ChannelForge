export type MediaSourceScanPolicy = Readonly<{
  intervalHours: number;
}>;

export type MediaSourceScanPolicyInput = Readonly<{
  intervalHours: number;
}>;

export function createMediaSourceScanPolicy(
  input: MediaSourceScanPolicyInput,
): MediaSourceScanPolicy {
  if (!Number.isFinite(input.intervalHours) || input.intervalHours < 0) {
    throw new RangeError(
      'Media Source scan interval must be a finite non-negative number',
    );
  }

  return Object.freeze({
    intervalHours: input.intervalHours,
  });
}
