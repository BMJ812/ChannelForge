import { describe, expect, it, vi } from 'vitest';

import {
  createCatalogModule,
  type CatalogSourceObservation,
  type CatalogSourceObservationPort,
} from '../index.js';

describe('Catalog module shell', () => {
  it('delegates normalized source observations through its owned port', async () => {
    const reconcileSourceObservation = vi.fn(async () => undefined);

    const sourceObservations: CatalogSourceObservationPort = {
      reconcileSourceObservation,
    };

    const catalog = createCatalogModule({
      sourceObservations,
    });

    const observation: CatalogSourceObservation = {
      source: {
        mediaSourceId: 'source-1',
        externalLibraryId: 'library-1',
        externalItemId: 'item-1',
        externalItemType: 'movie',
      },
      metadata: {
        title: 'Observed Movie',
        durationMs: 7_200_000,
      },
      observedAt: '2026-08-17T23:00:00.000Z',
    };

    await catalog.commands.reconcileSourceObservation(observation);

    expect(reconcileSourceObservation).toHaveBeenCalledWith(observation);
    expect(Object.isFrozen(catalog)).toBe(true);
  });
});
