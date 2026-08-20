import {
  createMediaSourceScanPolicyApplicationService,
  type MediaSourceScanPolicy,
} from '@/modules/media-sources/index.js';

import {
  TunarrMediaSourceScanPolicyStore,
  type TunarrGlobalMediaSourceSettings,
  type TunarrGlobalMediaSourceSettingsAccess,
} from '../settings/index.js';

export type LegacyMediaSourceSettingsRequest = TunarrGlobalMediaSourceSettings;

export type LegacyMediaSourceSettingsResponse = TunarrGlobalMediaSourceSettings;

export function legacyMediaSourceSettingsRequestToCanonical(
  request: LegacyMediaSourceSettingsRequest,
): Readonly<{
  intervalHours: number;
}> {
  return Object.freeze({
    intervalHours: request.rescanIntervalHours,
  });
}

export function canonicalMediaSourceScanPolicyToLegacyResponse(
  policy: MediaSourceScanPolicy,
): LegacyMediaSourceSettingsResponse {
  return Object.freeze({
    rescanIntervalHours: policy.intervalHours,
  });
}

export class TunarrMediaSourceSettingsRouteAdapter {
  private readonly service;

  constructor(access: TunarrGlobalMediaSourceSettingsAccess) {
    this.service = createMediaSourceScanPolicyApplicationService(
      new TunarrMediaSourceScanPolicyStore(access),
    );
  }

  async read(): Promise<LegacyMediaSourceSettingsResponse> {
    const policy = await this.service.getPolicy();

    return canonicalMediaSourceScanPolicyToLegacyResponse(policy);
  }

  async write(
    request: LegacyMediaSourceSettingsRequest,
  ): Promise<LegacyMediaSourceSettingsResponse> {
    const policy = await this.service.updatePolicy(
      legacyMediaSourceSettingsRequestToCanonical(request),
    );

    return canonicalMediaSourceScanPolicyToLegacyResponse(policy);
  }
}

export function createTunarrMediaSourceSettingsRouteAdapter(
  access: TunarrGlobalMediaSourceSettingsAccess,
): TunarrMediaSourceSettingsRouteAdapter {
  return new TunarrMediaSourceSettingsRouteAdapter(access);
}
