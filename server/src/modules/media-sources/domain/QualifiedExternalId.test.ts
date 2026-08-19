import { describe, expect, it } from 'vitest';

import { MediaSourceId } from './MediaSource.js';

import {
  createQualifiedExternalId,
  sameQualifiedExternalId,
} from './QualifiedExternalId.js';

describe('QualifiedExternalId', () => {
  it('qualifies provider identity by source, provider, entity type, and value', () => {
    const firstSource = MediaSourceId.generate();

    const secondSource = MediaSourceId.generate();

    const first = createQualifiedExternalId({
      mediaSourceId: firstSource,
      providerType: 'plex',
      entityType: 'library',
      value: '42',
    });

    const same = createQualifiedExternalId({
      mediaSourceId: firstSource,
      providerType: 'plex',
      entityType: 'library',
      value: '42',
    });

    const otherSource = createQualifiedExternalId({
      mediaSourceId: secondSource,
      providerType: 'plex',
      entityType: 'library',
      value: '42',
    });

    expect(sameQualifiedExternalId(first, same)).toBe(true);

    expect(sameQualifiedExternalId(first, otherSource)).toBe(false);
  });

  it('preserves provider-specific opaque identifier values', () => {
    const value = ' legacy-value ';

    const qualified = createQualifiedExternalId({
      mediaSourceId: MediaSourceId.generate(),
      providerType: 'jellyfin',
      entityType: 'item',
      value,
    });

    expect(qualified.value).toBe(value);
  });

  it('rejects blank external identity components', () => {
    expect(() =>
      createQualifiedExternalId({
        mediaSourceId: MediaSourceId.generate(),
        providerType: 'emby',
        entityType: '   ',
        value: 'x',
      }),
    ).toThrow(RangeError);

    expect(() =>
      createQualifiedExternalId({
        mediaSourceId: MediaSourceId.generate(),
        providerType: 'emby',
        entityType: 'item',
        value: '   ',
      }),
    ).toThrow(RangeError);
  });
});
