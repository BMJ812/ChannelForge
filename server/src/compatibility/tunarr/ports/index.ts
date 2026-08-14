export type ChannelForgeInstanceIdentity = Readonly<{
  instanceId: string;
}>;

export interface TunarrInstanceIdentityPort {
  readInstanceIdentity(): ChannelForgeInstanceIdentity;
}
