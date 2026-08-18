export { createMediaSourcesModule } from './application/MediaSourcesModule.js';

export type {
  MediaSourcesCommandService,
  MediaSourcesModule,
  MediaSourcesModuleDependencies,
} from './application/MediaSourcesModule.js';

export {
  MediaLibraryKinds,
  MediaSourceId,
  MediaSourceKinds,
  MediaSourceLibraryId,
} from './domain/MediaSource.js';

export type {
  MediaLibraryKind,
  MediaSourceKind,
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
