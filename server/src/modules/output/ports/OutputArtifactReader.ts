import type { ChannelId } from '@/modules/channels/index.js';

import type { OutputArtifact, OutputStreamRoute } from '../domain/Output.js';

export interface OutputArtifactReader {
  getXmltv(): Promise<OutputArtifact>;

  getM3u(): Promise<OutputArtifact>;

  getHdhrDiscovery(): Promise<OutputArtifact>;

  getHdhrLineup(): Promise<OutputArtifact>;

  resolveStreamRoute(channelId: ChannelId): Promise<OutputStreamRoute>;
}
