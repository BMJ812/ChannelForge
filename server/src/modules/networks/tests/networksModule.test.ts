import { describe, expect, it, vi } from 'vitest';

import {
  createNetworksModule,
  type NetworkCommandService,
  type NetworkQueryService,
} from '../index.js';

describe('Networks module shell', () => {
  it('registers public command and query services', () => {
    const commands: NetworkCommandService = {
      createNetwork: vi.fn(async () => 'network-1'),
    };

    const queries: NetworkQueryService = {
      getNetwork: vi.fn(async () => undefined),
    };

    const networks = createNetworksModule({
      commands,
      queries,
    });

    expect(networks.commands).toBe(commands);
    expect(networks.queries).toBe(queries);
    expect(Object.isFrozen(networks)).toBe(true);
  });
});
