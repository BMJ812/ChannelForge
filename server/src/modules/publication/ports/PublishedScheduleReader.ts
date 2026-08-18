import type { ChannelId } from '@/modules/channels/index.js';

import type {
  PublishedScheduleEntry,
  SchedulePublication,
} from '../domain/Publication.js';

export interface PublishedScheduleReader {
  getActivePublication(
    channelId: ChannelId,
  ): Promise<SchedulePublication | undefined>;

  resolvePublishedEntry(
    channelId: ChannelId,
    instant: string,
  ): Promise<PublishedScheduleEntry | undefined>;
}
