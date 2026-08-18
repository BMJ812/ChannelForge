import { describe, expect, it, vi } from 'vitest';

import {
  createPluginsModule,
  type PluginCommandService,
  type PluginQueryService,
} from '../index.js';

describe('Plugins module shell', () => {
  it('registers public command and query services', () => {
    const commands: PluginCommandService = {
      enablePlugin: vi.fn(async () => undefined),
      disablePlugin: vi.fn(async () => undefined),
    };

    const queries: PluginQueryService = {
      listPlugins: vi.fn(async () => []),
    };

    const plugins = createPluginsModule({
      commands,
      queries,
    });

    expect(plugins.commands).toBe(commands);
    expect(plugins.queries).toBe(queries);
    expect(Object.isFrozen(plugins)).toBe(true);
  });
});
