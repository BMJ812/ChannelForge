import type { ChannelId } from '@/modules/channels/index.js';
import type {
  ScheduleEntry,
  SchedulePlanId,
} from '@/modules/scheduling/index.js';

export type SchedulePublicationId = string;

export type PublicationStatus = 'pending' | 'active' | 'withdrawn' | 'failed';

export type SchedulePublication = Readonly<{
  publicationId: SchedulePublicationId;
  channelId: ChannelId;
  schedulePlanId: SchedulePlanId;
  status: PublicationStatus;
}>;

export type PublishedScheduleEntry = Readonly<{
  publicationId: SchedulePublicationId;
  schedulePlanId: SchedulePlanId;
  entry: ScheduleEntry;
}>;
