import { describe, expect, it, vi } from 'vitest';

import {
  createSchedulingModule,
  type ScheduleGenerationPort,
  type ScheduleGenerationRequest,
  type SchedulePlan,
} from '../index.js';

describe('Scheduling module shell', () => {
  it('delegates deterministic generation through its owned port', async () => {
    const plan: SchedulePlan = {
      schedulePlanId: 'plan-1',
      channelId: 'channel-1',
      programmingRevisionId: 'revision-1',
      entries: [],
    };

    const generateSchedule = vi.fn(async () => plan);

    const generation: ScheduleGenerationPort = {
      generateSchedule,
    };

    const scheduling = createSchedulingModule({
      generation,
    });

    const request: ScheduleGenerationRequest = {
      networkId: 'network-1',
      channelId: 'channel-1',
      programmingRevisionId: 'revision-1',
      catalogSnapshotId: 'snapshot-1',
      horizonStartsAt: '2026-08-18T00:00:00.000Z',
      horizonEndsAt: '2026-08-19T00:00:00.000Z',
      seed: 812,
    };

    const result = await scheduling.commands.generateSchedule(request);

    expect(result).toBe(plan);
    expect(generateSchedule).toHaveBeenCalledWith(request);
    expect(Object.isFrozen(scheduling)).toBe(true);
  });
});
