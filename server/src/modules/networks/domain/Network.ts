import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

export type NetworkId = BrandedIdentifier<'NetworkId'>;

export const NetworkId = createUuidV4IdentifierCodec<NetworkId>('NetworkId');

export type NetworkProfileRevisionId =
  BrandedIdentifier<'NetworkProfileRevisionId'>;

export const NetworkProfileRevisionId =
  createUuidV4IdentifierCodec<NetworkProfileRevisionId>(
    'NetworkProfileRevisionId',
  );

export type NetworkSummary = Readonly<{
  networkId: NetworkId;
  name: string;
  activeProfileRevisionId?: NetworkProfileRevisionId;
}>;
