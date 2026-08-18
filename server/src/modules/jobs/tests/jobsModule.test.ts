import { describe, expect, it, vi } from 'vitest';

import { createJobsModule, type JobDispatcher } from '../index.js';

describe('Jobs module shell', () => {
  it('delegates enqueue through its owned dispatcher', async () => {
    const dispatcher: JobDispatcher = {
      enqueue: vi.fn(async () => 'job-1'),
    };

    const jobs = createJobsModule({
      dispatcher,
    });

    const result = await jobs.commands.enqueue({
      jobType: 'catalog-sync',
    });

    expect(result).toBe('job-1');
    expect(dispatcher.enqueue).toHaveBeenCalledWith({
      jobType: 'catalog-sync',
    });
    expect(Object.isFrozen(jobs)).toBe(true);
  });
});
