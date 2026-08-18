export type NetworkId = string;

export type NetworkProfileRevisionId = string;

export type NetworkSummary = Readonly<{
  networkId: NetworkId;
  name: string;
  activeProfileRevisionId?: NetworkProfileRevisionId;
}>;
