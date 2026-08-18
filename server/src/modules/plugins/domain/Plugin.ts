export type PluginId = string;

export type PluginCapability = string;

export type PluginSummary = Readonly<{
  pluginId: PluginId;
  name: string;
  enabled: boolean;
  capabilities: readonly PluginCapability[];
}>;
