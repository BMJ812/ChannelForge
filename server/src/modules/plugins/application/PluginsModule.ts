import type { PluginId, PluginSummary } from '../domain/Plugin.js';

export interface PluginCommandService {
  enablePlugin(pluginId: PluginId): Promise<void>;
  disablePlugin(pluginId: PluginId): Promise<void>;
}

export interface PluginQueryService {
  listPlugins(): Promise<readonly PluginSummary[]>;
}

export type PluginsModuleDependencies = Readonly<{
  commands: PluginCommandService;
  queries: PluginQueryService;
}>;

export type PluginsModule = Readonly<{
  commands: PluginCommandService;
  queries: PluginQueryService;
}>;

export function createPluginsModule(
  dependencies: PluginsModuleDependencies,
): PluginsModule {
  return Object.freeze({
    commands: dependencies.commands,
    queries: dependencies.queries,
  });
}
