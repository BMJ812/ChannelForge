import type { ChannelId } from '@/modules/channels/index.js';
import type { NetworkId } from '@/modules/networks/index.js';

import type {
  ProgrammingConfigurationId,
  ProgrammingConfigurationRevisionId,
} from '../domain/Programming.js';

export type ProgrammingTarget = Readonly<{
  networkId: NetworkId;
  channelId?: ChannelId;
}>;

export type ProgrammingRevisionSummary = Readonly<{
  configurationId: ProgrammingConfigurationId;
  revisionId: ProgrammingConfigurationRevisionId;
  target: ProgrammingTarget;
  active: boolean;
}>;

export interface ProgrammingCommandService {
  createProgrammingConfiguration(
    target: ProgrammingTarget,
  ): Promise<ProgrammingConfigurationId>;
}

export interface ProgrammingQueryService {
  getActiveProgrammingRevision(
    target: ProgrammingTarget,
  ): Promise<ProgrammingRevisionSummary | undefined>;
}

export type ProgrammingModuleDependencies = Readonly<{
  commands: ProgrammingCommandService;
  queries: ProgrammingQueryService;
}>;

export type ProgrammingModule = Readonly<{
  commands: ProgrammingCommandService;
  queries: ProgrammingQueryService;
}>;

export function createProgrammingModule(
  dependencies: ProgrammingModuleDependencies,
): ProgrammingModule {
  return Object.freeze({
    commands: dependencies.commands,
    queries: dependencies.queries,
  });
}
