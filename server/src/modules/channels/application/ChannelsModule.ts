import type { NetworkId } from '@/modules/networks/index.js';

import type {
  ChannelId,
  ChannelNumber,
  ChannelProfileRevisionId,
} from '../domain/Channel.js';

export type ChannelSummary = Readonly<{
  channelId: ChannelId;
  networkId: NetworkId;
  number: ChannelNumber;
  name: string;
  activeProfileRevisionId?: ChannelProfileRevisionId;
}>;

export interface ChannelCommandService {
  createChannel(
    input: Readonly<{
      networkId: NetworkId;
      number: ChannelNumber;
      name: string;
    }>,
  ): Promise<ChannelId>;
}

export interface ChannelQueryService {
  getChannel(channelId: ChannelId): Promise<ChannelSummary | undefined>;
}

export type ChannelsModuleDependencies = Readonly<{
  commands: ChannelCommandService;
  queries: ChannelQueryService;
}>;

export type ChannelsModule = Readonly<{
  commands: ChannelCommandService;
  queries: ChannelQueryService;
}>;

export function createChannelsModule(
  dependencies: ChannelsModuleDependencies,
): ChannelsModule {
  return Object.freeze({
    commands: dependencies.commands,
    queries: dependencies.queries,
  });
}
