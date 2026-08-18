import { describe, expect, it, vi } from 'vitest';

import { createAccessModule, type AuthorizationService } from '../index.js';

describe('Access module shell', () => {
  it('registers the supplied authorization boundary without implementing authentication', async () => {
    const requirePermission = vi.fn(async () => undefined);

    const authorization: AuthorizationService = {
      requirePermission,
    };

    const access = createAccessModule({
      authorization,
    });

    expect(access.authorization).toBe(authorization);
    expect(Object.isFrozen(access)).toBe(true);

    await access.authorization.requirePermission(
      {
        principalId: 'principal-1',
      },
      'manage-instance',
    );

    expect(requirePermission).toHaveBeenCalledWith(
      {
        principalId: 'principal-1',
      },
      'manage-instance',
    );
  });
});
