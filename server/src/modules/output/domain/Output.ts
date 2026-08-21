import type { ChannelId } from '@/modules/channels/index.js';

export type OutputProfileId = string;

export type HdhrCompatibleIdentity = Readonly<{
  deviceId: string;
}>;

export type OutputArtifact = Readonly<{
  contentType: string;
  body: string;
  checksum?: string;
}>;

export type OutputStreamRoute = Readonly<{
  channelId: ChannelId;
  path: string;
}>;
