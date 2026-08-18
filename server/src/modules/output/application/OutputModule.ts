import type { ChannelId } from '@/modules/channels/index.js';

import type { OutputArtifact, OutputStreamRoute } from '../domain/Output.js';
import type { OutputArtifactReader } from '../ports/OutputArtifactReader.js';

export interface OutputQueryService {
  getXmltv(): Promise<OutputArtifact>;
  getM3u(): Promise<OutputArtifact>;
  getHdhrDiscovery(): Promise<OutputArtifact>;
  getHdhrLineup(): Promise<OutputArtifact>;

  resolveStreamRoute(channelId: ChannelId): Promise<OutputStreamRoute>;
}

export type OutputModuleDependencies = Readonly<{
  artifacts: OutputArtifactReader;
}>;

export type OutputModule = Readonly<{
  queries: OutputQueryService;
}>;

class DefaultOutputQueryService implements OutputQueryService {
  constructor(private readonly artifacts: OutputArtifactReader) {}

  getXmltv(): Promise<OutputArtifact> {
    return this.artifacts.getXmltv();
  }

  getM3u(): Promise<OutputArtifact> {
    return this.artifacts.getM3u();
  }

  getHdhrDiscovery(): Promise<OutputArtifact> {
    return this.artifacts.getHdhrDiscovery();
  }

  getHdhrLineup(): Promise<OutputArtifact> {
    return this.artifacts.getHdhrLineup();
  }

  resolveStreamRoute(channelId: ChannelId): Promise<OutputStreamRoute> {
    return this.artifacts.resolveStreamRoute(channelId);
  }
}

export function createOutputModule(
  dependencies: OutputModuleDependencies,
): OutputModule {
  return Object.freeze({
    queries: new DefaultOutputQueryService(dependencies.artifacts),
  });
}
