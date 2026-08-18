import type { PublishedScheduleEntry } from '@/modules/publication/index.js';

export type PlaybackResolution = Readonly<{
  playbackVariantId: string;
  inputUri: string;
}>;

export interface PlaybackResolver {
  resolvePlayback(entry: PublishedScheduleEntry): Promise<PlaybackResolution>;
}
