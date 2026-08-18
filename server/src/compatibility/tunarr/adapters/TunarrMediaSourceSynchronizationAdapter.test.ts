import {
  createMediaSourcesModule,
  type MediaSourceSynchronizationPort,
} from '@/modules/media-sources/index.js';
import type { MediaSourceScanCoordinator } from '@/services/scanner/MediaSourceScanCoordinator.js';
import { describe, expect, it, vi } from 'vitest';

import { TunarrCompatibilityUsageMetrics } from '../usage/CompatibilityUsageMetrics.js';
import { TunarrMediaSourceSynchronizationAdapter } from './TunarrMediaSourceSynchronizationAdapter.js';

type LegacyScanCoordinator = Pick<
  MediaSourceScanCoordinator,
  'add' | 'addLocal'
>;

describe('TunarrMediaSourceSynchronizationAdapter', () => {
  it('translates a library synchronization request to the inherited coordinator', async () => {
    const add = vi.fn<LegacyScanCoordinator['add']>(async () => true);
    const addLocal = vi.fn<LegacyScanCoordinator['addLocal']>(
      async () => false,
    );
    const metrics = new TunarrCompatibilityUsageMetrics();

    const adapter = new TunarrMediaSourceSynchronizationAdapter(
      { add, addLocal },
      metrics,
    );

    const result = await adapter.requestSynchronization({
      scope: 'library',
      libraryId: 'library-1',
      force: true,
      pathFilter: 'movies',
    });

    expect(result).toBe(true);
    expect(add).toHaveBeenCalledWith({
      libraryId: 'library-1',
      forceScan: true,
      pathFilter: 'movies',
    });
    expect(addLocal).not.toHaveBeenCalled();
    expect(metrics.snapshot()).toEqual({
      'instance-identity-read': 0,
      'media-source-synchronization-request': 1,
    });
  });

  it('translates a local-source request to the inherited local scan path', async () => {
    const add = vi.fn<LegacyScanCoordinator['add']>(async () => false);
    const addLocal = vi.fn<LegacyScanCoordinator['addLocal']>(async () => true);
    const metrics = new TunarrCompatibilityUsageMetrics();

    const adapter = new TunarrMediaSourceSynchronizationAdapter(
      { add, addLocal },
      metrics,
    );

    const result = await adapter.requestSynchronization({
      scope: 'local-source',
      mediaSourceId: 'source-1',
    });

    expect(result).toBe(true);
    expect(addLocal).toHaveBeenCalledWith({
      mediaSourceId: 'source-1',
      forceScan: false,
    });
    expect(add).not.toHaveBeenCalled();
    expect(metrics.snapshot()).toEqual({
      'instance-identity-read': 0,
      'media-source-synchronization-request': 1,
    });
  });

  it('satisfies the Media Sources synchronization port through public composition', async () => {
    const add = vi.fn<LegacyScanCoordinator['add']>(async () => true);
    const addLocal = vi.fn<LegacyScanCoordinator['addLocal']>(async () => true);
    const metrics = new TunarrCompatibilityUsageMetrics();

    const adapter: MediaSourceSynchronizationPort =
      new TunarrMediaSourceSynchronizationAdapter({ add, addLocal }, metrics);

    const mediaSources = createMediaSourcesModule({
      synchronization: adapter,
    });

    await mediaSources.commands.requestSynchronization({
      scope: 'library',
      libraryId: 'library-2',
    });

    expect(add).toHaveBeenCalledWith({
      libraryId: 'library-2',
      forceScan: false,
    });
    expect(metrics.snapshot()).toEqual({
      'instance-identity-read': 0,
      'media-source-synchronization-request': 1,
    });
  });
});
