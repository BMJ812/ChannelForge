import type { CatalogItemId } from '@/modules/catalog/index.js';
import type { ChannelId } from '@/modules/channels/index.js';
import type { ProgrammingConfigurationRevisionId } from '@/modules/programming/index.js';

export type SchedulePlanId = string;

export type ScheduleEntryId = string;

export type ScheduleEntry = Readonly<{
  scheduleEntryId: ScheduleEntryId;
  channelId: ChannelId;
  catalogItemId: CatalogItemId;
  startsAt: string;
  endsAt: string;
}>;

export type SchedulePlan = Readonly<{
  schedulePlanId: SchedulePlanId;
  channelId: ChannelId;
  programmingRevisionId: ProgrammingConfigurationRevisionId;
  entries: readonly ScheduleEntry[];
}>;
