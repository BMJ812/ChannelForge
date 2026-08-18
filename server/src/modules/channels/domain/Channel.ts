import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

export type ChannelId = BrandedIdentifier<'ChannelId'>;

export const ChannelId = createUuidV4IdentifierCodec<ChannelId>('ChannelId');

export type ChannelProfileRevisionId =
  BrandedIdentifier<'ChannelProfileRevisionId'>;

export const ChannelProfileRevisionId =
  createUuidV4IdentifierCodec<ChannelProfileRevisionId>(
    'ChannelProfileRevisionId',
  );

export type ChannelNumber = string;
