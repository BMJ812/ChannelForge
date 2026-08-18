export { CatalogItemId, CatalogSnapshotId } from './domain/CatalogIdentity.js';

export { createCatalogModule } from './application/CatalogModule.js';

export type {
  CatalogCommandService,
  CatalogModule,
  CatalogModuleDependencies,
} from './application/CatalogModule.js';

export type {
  CatalogSourceMetadataObservation,
  CatalogSourceObservation,
  CatalogSourceReference,
} from './ports/CatalogSourceObservation.js';

export type { CatalogSourceObservationPort } from './ports/CatalogSourceObservationPort.js';
