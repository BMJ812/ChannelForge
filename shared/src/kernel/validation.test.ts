import { describe, expect, it } from 'vitest';

import { isNonEmptyString } from './index.js';

describe('isNonEmptyString', () => {
  it('accepts non-empty primitive strings', () => {
    expect(isNonEmptyString('channel-forge')).toBe(true);
  });

  it('preserves the inherited lodash boxed-string behavior', () => {
    expect(isNonEmptyString(new String('channel-forge'))).toBe(true);
  });

  it('rejects empty strings', () => {
    expect(isNonEmptyString('')).toBe(false);
  });

  it.each([
    null,
    undefined,
    0,
    false,
    {},
    [],
  ])('rejects non-string value %j', (value) => {
    expect(isNonEmptyString(value)).toBe(false);
  });
});
