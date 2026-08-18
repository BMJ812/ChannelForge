import type { PublishedScheduleReader } from '@/modules/publication/index.js';

import type { PlaybackResolver } from '../ports/PlaybackResolver.js';
import type { StreamProcessRunner } from '../ports/StreamProcessRunner.js';

export type PlayoutModuleDependencies = Readonly<{
  publishedSchedules: PublishedScheduleReader;
  playbackResolver: PlaybackResolver;
  streamProcesses: StreamProcessRunner;
}>;

export type PlayoutModule = Readonly<{
  publishedSchedules: PublishedScheduleReader;
  playbackResolver: PlaybackResolver;
  streamProcesses: StreamProcessRunner;
}>;

export function createPlayoutModule(
  dependencies: PlayoutModuleDependencies,
): PlayoutModule {
  return Object.freeze({
    publishedSchedules: dependencies.publishedSchedules,
    playbackResolver: dependencies.playbackResolver,
    streamProcesses: dependencies.streamProcesses,
  });
}
