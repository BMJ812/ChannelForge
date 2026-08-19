import type { MediaSourceId, RemoteMediaSourceKind } from './MediaSource.js';

export type QualifiedExternalId = Readonly<{
  mediaSourceId: MediaSourceId;
  providerType: RemoteMediaSourceKind;
  entityType: string;
  value: string;
}>;

export type CreateQualifiedExternalIdRequest = Readonly<{
  mediaSourceId: MediaSourceId;
  providerType: RemoteMediaSourceKind;
  entityType: string;
  value: string;
}>;

function requireNormalizedLabel(label: string, value: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RangeError(`${label} must not be empty`);
  }

  return normalized;
}

function requireOpaqueValue(label: string, value: string): string {
  if (value.trim().length === 0) {
    throw new RangeError(`${label} must not be empty`);
  }

  return value;
}

export function createQualifiedExternalId(
  request: CreateQualifiedExternalIdRequest,
): QualifiedExternalId {
  return Object.freeze({
    mediaSourceId: request.mediaSourceId,

    providerType: request.providerType,

    entityType: requireNormalizedLabel(
      'external entity type',
      request.entityType,
    ),

    value: requireOpaqueValue('external identifier value', request.value),
  });
}

export function sameQualifiedExternalId(
  left: QualifiedExternalId,
  right: QualifiedExternalId,
): boolean {
  return (
    left.mediaSourceId === right.mediaSourceId &&
    left.providerType === right.providerType &&
    left.entityType === right.entityType &&
    left.value === right.value
  );
}
