import { describe, expect, it, vi } from 'vitest';

import { createOutputModule, type OutputArtifactReader } from '../index.js';

describe('Output module shell', () => {
  it('delegates protocol reads through the Output-owned port', async () => {
    const empty = {
      contentType: 'text/plain',
      body: '',
    };

    const artifacts: OutputArtifactReader = {
      getXmltv: vi.fn(async () => empty),
      getM3u: vi.fn(async () => empty),
      getHdhrDiscovery: vi.fn(async () => empty),
      getHdhrLineup: vi.fn(async () => empty),
      resolveStreamRoute: vi.fn(async (channelId) => ({
        channelId,
        path: `/stream/${channelId}`,
      })),
    };

    const output = createOutputModule({
      artifacts,
    });

    await output.queries.getXmltv();
    await output.queries.getM3u();

    expect(artifacts.getXmltv).toHaveBeenCalledOnce();
    expect(artifacts.getM3u).toHaveBeenCalledOnce();
    expect(Object.isFrozen(output)).toBe(true);
  });
});
