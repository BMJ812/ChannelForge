import type { CatalogSourceObservation } from '../ports/CatalogSourceObservation.js';
import type { CatalogSourceObservationPort } from '../ports/CatalogSourceObservationPort.js';

export interface CatalogCommandService {
  reconcileSourceObservation(
    observation: CatalogSourceObservation,
  ): Promise<void>;
}

export type CatalogModuleDependencies = Readonly<{
  sourceObservations: CatalogSourceObservationPort;
}>;

export type CatalogModule = Readonly<{
  commands: CatalogCommandService;
}>;

class DefaultCatalogCommandService implements CatalogCommandService {
  constructor(
    private readonly sourceObservations: CatalogSourceObservationPort,
  ) {}

  reconcileSourceObservation(
    observation: CatalogSourceObservation,
  ): Promise<void> {
    return this.sourceObservations.reconcileSourceObservation(observation);
  }
}

export function createCatalogModule(
  dependencies: CatalogModuleDependencies,
): CatalogModule {
  return Object.freeze({
    commands: new DefaultCatalogCommandService(dependencies.sourceObservations),
  });
}
