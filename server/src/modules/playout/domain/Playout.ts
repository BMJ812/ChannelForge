import type { ChannelId } from '@/modules/channels/index.js';

export type PlayoutSessionId = string;

export type PlayoutSessionStatus =
  | 'starting'
  | 'running'
  | 'recovering'
  | 'stopped'
  | 'failed';

export type PlayoutSessionSummary = Readonly<{
  sessionId: PlayoutSessionId;
  channelId: ChannelId;
  status: PlayoutSessionStatus;
}>;
