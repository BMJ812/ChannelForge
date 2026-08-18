import type { CatalogSourceObservation } from './CatalogSourceObservation.js';

export interface CatalogSourceObservationPort {
  reconcileSourceObservation(
    observation: CatalogSourceObservation,
  ): Promise<void>;
}
