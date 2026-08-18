import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
} from '@tunarr/shared/kernel';

export type InstanceId = BrandedIdentifier<'InstanceId'>;

export const InstanceId = createUuidV4IdentifierCodec<InstanceId>('InstanceId');
