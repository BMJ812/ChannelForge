import type { CatalogSnapshotId } from '@/modules/catalog/index.js';
import type { ChannelId } from '@/modules/channels/index.js';
import type { NetworkId } from '@/modules/networks/index.js';
import type { ProgrammingConfigurationRevisionId } from '@/modules/programming/index.js';

import type { SchedulePlan } from '../domain/Schedule.js';

export type ScheduleGenerationRequest = Readonly<{
  networkId: NetworkId;
  channelId: ChannelId;
  programmingRevisionId: ProgrammingConfigurationRevisionId;
  catalogSnapshotId: CatalogSnapshotId;
  horizonStartsAt: string;
  horizonEndsAt: string;
  seed: number;
}>;

export interface ScheduleGenerationPort {
  generateSchedule(request: ScheduleGenerationRequest): Promise<SchedulePlan>;
}
