import { describe, expect, it, vi } from 'vitest';

import type { PublishedScheduleReader } from '@/modules/publication/index.js';

import {
  createPlayoutModule,
  type PlaybackResolver,
  type StreamProcessRunner,
} from '../index.js';

describe('Playout module shell', () => {
  it('registers publication, playback, and process boundaries', () => {
    const publishedSchedules: PublishedScheduleReader = {
      getActivePublication: vi.fn(async () => undefined),
      resolvePublishedEntry: vi.fn(async () => undefined),
    };

    const playbackResolver: PlaybackResolver = {
      resolvePlayback: vi.fn(async () => ({
        playbackVariantId: 'variant-1',
        inputUri: 'test://input',
      })),
    };

    const streamProcesses: StreamProcessRunner = {
      start: vi.fn(async () => ({
        processId: 'process-1',
        stop: vi.fn(async () => undefined),
      })),
    };

    const playout = createPlayoutModule({
      publishedSchedules,
      playbackResolver,
      streamProcesses,
    });

    expect(playout.publishedSchedules).toBe(publishedSchedules);
    expect(playout.playbackResolver).toBe(playbackResolver);
    expect(playout.streamProcesses).toBe(streamProcesses);
    expect(Object.isFrozen(playout)).toBe(true);
  });
});
