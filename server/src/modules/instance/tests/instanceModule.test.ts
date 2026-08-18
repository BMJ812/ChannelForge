import { describe, expect, it, vi } from 'vitest';

import { createInstanceModule, type InstanceIdentityReader } from '../index.js';

describe('Instance module shell', () => {
  it('reads identity through its declared port', () => {
    const readInstanceIdentity = vi.fn(() => ({
      instanceId: 'instance-1',
    }));

    const identityReader: InstanceIdentityReader = {
      readInstanceIdentity,
    };

    const instance = createInstanceModule({
      identityReader,
    });

    expect(instance.queries.getInstanceIdentity()).toEqual({
      instanceId: 'instance-1',
    });

    expect(readInstanceIdentity).toHaveBeenCalledTimes(1);
    expect(Object.isFrozen(instance)).toBe(true);
  });

  it('does not expose inherited clientId terminology', () => {
    const instance = createInstanceModule({
      identityReader: {
        readInstanceIdentity: () => ({
          instanceId: 'channel-forge-instance',
        }),
      },
    });

    const result = instance.queries.getInstanceIdentity();

    expect('clientId' in result).toBe(false);
  });
});
