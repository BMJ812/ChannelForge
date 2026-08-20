import {
  createMediaSourceScanPolicy,
  type MediaSourceScanPolicy,
  type MediaSourceScanPolicyStore,
} from '@/modules/media-sources/index.js';

export type TunarrGlobalMediaSourceSettings = Readonly<{
  rescanIntervalHours: number;
}>;

export type TunarrGlobalMediaSourceSettingsAccess = Readonly<{
  read(): TunarrGlobalMediaSourceSettings;

  write(value: TunarrGlobalMediaSourceSettings): Promise<void>;
}>;

export function fromTunarrGlobalMediaSourceSettings(
  value: TunarrGlobalMediaSourceSettings,
): MediaSourceScanPolicy {
  return createMediaSourceScanPolicy({
    intervalHours: value.rescanIntervalHours,
  });
}

export function toTunarrGlobalMediaSourceSettings(
  policy: MediaSourceScanPolicy,
): TunarrGlobalMediaSourceSettings {
  return Object.freeze({
    rescanIntervalHours: policy.intervalHours,
  });
}

export class TunarrMediaSourceScanPolicyStore
  implements MediaSourceScanPolicyStore
{
  constructor(private readonly access: TunarrGlobalMediaSourceSettingsAccess) {}

  async read(): Promise<MediaSourceScanPolicy> {
    return fromTunarrGlobalMediaSourceSettings(this.access.read());
  }

  write(policy: MediaSourceScanPolicy): Promise<void> {
    return this.access.write(toTunarrGlobalMediaSourceSettings(policy));
  }
}
