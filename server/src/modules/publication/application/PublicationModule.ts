import type { ChannelId } from '@/modules/channels/index.js';

import type {
  PublishedScheduleEntry,
  SchedulePublication,
} from '../domain/Publication.js';
import type { PublishedScheduleReader } from '../ports/PublishedScheduleReader.js';

export interface PublicationQueryService {
  getActivePublication(
    channelId: ChannelId,
  ): Promise<SchedulePublication | undefined>;

  resolvePublishedEntry(
    channelId: ChannelId,
    instant: string,
  ): Promise<PublishedScheduleEntry | undefined>;
}

export type PublicationModuleDependencies = Readonly<{
  publishedSchedules: PublishedScheduleReader;
}>;

export type PublicationModule = Readonly<{
  queries: PublicationQueryService;
}>;

class DefaultPublicationQueryService implements PublicationQueryService {
  constructor(private readonly publishedSchedules: PublishedScheduleReader) {}

  getActivePublication(
    channelId: ChannelId,
  ): Promise<SchedulePublication | undefined> {
    return this.publishedSchedules.getActivePublication(channelId);
  }

  resolvePublishedEntry(
    channelId: ChannelId,
    instant: string,
  ): Promise<PublishedScheduleEntry | undefined> {
    return this.publishedSchedules.resolvePublishedEntry(channelId, instant);
  }
}

export function createPublicationModule(
  dependencies: PublicationModuleDependencies,
): PublicationModule {
  return Object.freeze({
    queries: new DefaultPublicationQueryService(
      dependencies.publishedSchedules,
    ),
  });
}
