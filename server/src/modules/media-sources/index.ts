export { createMediaSourcesModule } from './application/MediaSourcesModule.js';

export type {
  MediaSourcesCommandService,
  MediaSourcesModule,
  MediaSourcesModuleDependencies,
} from './application/MediaSourcesModule.js';

export {
  createMediaSourceCredentialReference,
  MediaLibraryKinds,
  MediaSourceId,
  MediaSourceKinds,
  MediaSourceLibraryId,
} from './domain/MediaSource.js';

export type {
  MediaLibraryKind,
  MediaSourceCredentialReference,
  MediaSourceKind,
  MediaSourceLibraryBindingReadModel,
  MediaSourcePathReplacementReadModel,
  RemoteMediaSourceKind,
  RemoteMediaSourceProviderConfiguration,
  RemoteMediaSourceReadModel,
} from './domain/MediaSource.js';

export {
  createQualifiedExternalId,
  sameQualifiedExternalId,
} from './domain/QualifiedExternalId.js';

export type {
  CreateQualifiedExternalIdRequest,
  QualifiedExternalId,
} from './domain/QualifiedExternalId.js';

export type {
  MediaSourceProviderAdapter,
  MediaSourceProviderAdapterRegistry,
  ProviderLibraryObservation,
} from './ports/ProviderAdapter.js';

export type {
  MediaSourceSynchronizationPort,
  MediaSourceSynchronizationRequest,
} from './ports/MediaSourceSynchronization.js';

export { createMediaSourceScanPolicy } from './domain/MediaSourceScanPolicy.js';

export type {
  MediaSourceScanPolicy,
  MediaSourceScanPolicyInput,
} from './domain/MediaSourceScanPolicy.js';

export { createMediaSourceScanPolicyApplicationService } from './application/MediaSourceScanPolicyService.js';

export type { MediaSourceScanPolicyApplicationService } from './application/MediaSourceScanPolicyService.js';

export type { MediaSourceScanPolicyStore } from './ports/MediaSourceScanPolicyStore.js';
