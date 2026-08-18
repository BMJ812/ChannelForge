import { describe, expect, it, vi } from 'vitest';

import {
  createChannelsModule,
  type ChannelCommandService,
  type ChannelQueryService,
} from '../index.js';

describe('Channels module shell', () => {
  it('registers public command and query services', () => {
    const commands: ChannelCommandService = {
      createChannel: vi.fn(async () => 'channel-1'),
    };

    const queries: ChannelQueryService = {
      getChannel: vi.fn(async () => undefined),
    };

    const channels = createChannelsModule({
      commands,
      queries,
    });

    expect(channels.commands).toBe(commands);
    expect(channels.queries).toBe(queries);
    expect(Object.isFrozen(channels)).toBe(true);
  });
});
