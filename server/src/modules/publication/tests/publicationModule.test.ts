import { describe, expect, it, vi } from 'vitest';

import {
  createPublicationModule,
  type PublishedScheduleReader,
} from '../index.js';

describe('Publication module shell', () => {
  it('delegates published schedule reads through its owned port', async () => {
    const getActivePublication = vi.fn(async () => undefined);
    const resolvePublishedEntry = vi.fn(async () => undefined);

    const publishedSchedules: PublishedScheduleReader = {
      getActivePublication,
      resolvePublishedEntry,
    };

    const publication = createPublicationModule({
      publishedSchedules,
    });

    await publication.queries.getActivePublication('channel-1');
    await publication.queries.resolvePublishedEntry(
      'channel-1',
      '2026-08-18T12:00:00.000Z',
    );

    expect(getActivePublication).toHaveBeenCalledWith('channel-1');
    expect(resolvePublishedEntry).toHaveBeenCalledWith(
      'channel-1',
      '2026-08-18T12:00:00.000Z',
    );
    expect(Object.isFrozen(publication)).toBe(true);
  });
});
