export { createMediaSourcesModule } from './application/MediaSourcesModule.js';

export type {
  MediaSourcesCommandService,
  MediaSourcesModule,
  MediaSourcesModuleDependencies,
} from './application/MediaSourcesModule.js';

export { MediaLibraryKinds, MediaSourceKinds } from './domain/MediaSource.js';

export type {
  MediaLibraryKind,
  MediaSourceId,
  MediaSourceKind,
  MediaSourceLibraryId,
  RemoteMediaSourceKind,
} from './domain/MediaSource.js';

export type {
  MediaSourceProviderAdapter,
  MediaSourceProviderAdapterRegistry,
  ProviderLibraryObservation,
} from './ports/ProviderAdapter.js';

export type {
  MediaSourceSynchronizationPort,
  MediaSourceSynchronizationRequest,
} from './ports/MediaSourceSynchronization.js';
