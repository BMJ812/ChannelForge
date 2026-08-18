import type {
  MediaSourceId,
  MediaSourceLibraryId,
} from '../domain/MediaSource.js';

export type MediaSourceSynchronizationRequest =
  | Readonly<{
      scope: 'local-source';
      mediaSourceId: MediaSourceId;
      force?: boolean;
      pathFilter?: string;
    }>
  | Readonly<{
      scope: 'library';
      libraryId: MediaSourceLibraryId;
      force?: boolean;
      pathFilter?: string;
    }>;

export interface MediaSourceSynchronizationPort {
  requestSynchronization(
    request: MediaSourceSynchronizationRequest,
  ): Promise<boolean>;
}
