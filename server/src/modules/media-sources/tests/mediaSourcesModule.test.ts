import { describe, expect, it, vi } from 'vitest';

import {
  createMediaSourcesModule,
  type MediaSourceSynchronizationPort,
} from '../index.js';

describe('Media Sources module shell', () => {
  it('delegates synchronization requests through its owned port', async () => {
    const requestSynchronization = vi.fn(async () => true);

    const synchronization: MediaSourceSynchronizationPort = {
      requestSynchronization,
    };

    const mediaSources = createMediaSourcesModule({
      synchronization,
    });

    const result = await mediaSources.commands.requestSynchronization({
      scope: 'library',
      libraryId: 'library-1',
      force: true,
      pathFilter: 'movies',
    });

    expect(result).toBe(true);
    expect(requestSynchronization).toHaveBeenCalledWith({
      scope: 'library',
      libraryId: 'library-1',
      force: true,
      pathFilter: 'movies',
    });
    expect(Object.isFrozen(mediaSources)).toBe(true);
  });
});
