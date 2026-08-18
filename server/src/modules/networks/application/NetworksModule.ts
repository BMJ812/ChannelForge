import type { NetworkId, NetworkSummary } from '../domain/Network.js';

export interface NetworkCommandService {
  createNetwork(input: Readonly<{ name: string }>): Promise<NetworkId>;
}

export interface NetworkQueryService {
  getNetwork(networkId: NetworkId): Promise<NetworkSummary | undefined>;
}

export type NetworksModuleDependencies = Readonly<{
  commands: NetworkCommandService;
  queries: NetworkQueryService;
}>;

export type NetworksModule = Readonly<{
  commands: NetworkCommandService;
  queries: NetworkQueryService;
}>;

export function createNetworksModule(
  dependencies: NetworksModuleDependencies,
): NetworksModule {
  return Object.freeze({
    commands: dependencies.commands,
    queries: dependencies.queries,
  });
}
