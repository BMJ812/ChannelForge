import type {
  MediaSourceSynchronizationPort,
  MediaSourceSynchronizationRequest,
} from '@/modules/media-sources/index.js';
import type { MediaSourceScanCoordinator } from '@/services/scanner/MediaSourceScanCoordinator.js';
import type { MediaSourceId as LegacyMediaSourceId } from '@tunarr/shared';
import { tag } from '@tunarr/types';

import {
  TunarrCompatibilityUsageMetrics,
  tunarrCompatibilityUsageMetrics,
} from '../usage/CompatibilityUsageMetrics.js';

type LegacyScanCoordinator = Pick<
  MediaSourceScanCoordinator,
  'add' | 'addLocal'
>;

export class TunarrMediaSourceSynchronizationAdapter
  implements MediaSourceSynchronizationPort
{
  constructor(
    private readonly coordinator: LegacyScanCoordinator,
    private readonly usageMetrics: TunarrCompatibilityUsageMetrics = tunarrCompatibilityUsageMetrics,
  ) {}

  requestSynchronization(
    request: MediaSourceSynchronizationRequest,
  ): Promise<boolean> {
    this.usageMetrics.record('media-source-synchronization-request');

    if (request.scope === 'local-source') {
      return this.coordinator.addLocal({
        mediaSourceId: tag<LegacyMediaSourceId>(request.mediaSourceId),
        forceScan: request.force ?? false,
        ...(request.pathFilter === undefined
          ? {}
          : { pathFilter: request.pathFilter }),
      });
    }

    return this.coordinator.add({
      libraryId: request.libraryId,
      forceScan: request.force ?? false,
      ...(request.pathFilter === undefined
        ? {}
        : { pathFilter: request.pathFilter }),
    });
  }
}
