import { describe, expect, it } from 'vitest';

import {
  createUuidV4IdentifierCodec,
  type BrandedIdentifier,
  InvalidIdentifierError,
  isCanonicalUuidV4,
} from './identifier.js';

type TestId = BrandedIdentifier<'TestId'>;

const TestId = createUuidV4IdentifierCodec<TestId>('TestId');

describe('ChannelForge identifier primitive', () => {
  it('generates canonical lowercase UUIDv4 identifiers', () => {
    const value = TestId.generate();

    expect(isCanonicalUuidV4(value)).toBe(true);
    expect(value).toBe(value.toLowerCase());
  });

  it('parses a canonical UUIDv4', () => {
    const value = '123e4567-e89b-42d3-a456-426614174000';

    expect(TestId.parse(value)).toBe(value);
    expect(TestId.toString(TestId.parse(value))).toBe(value);
  });

  it('rejects malformed, uppercase, and non-v4 identifiers', () => {
    expect(() => TestId.parse('not-an-id')).toThrow(InvalidIdentifierError);

    expect(() => TestId.parse('123E4567-E89B-42D3-A456-426614174000')).toThrow(
      InvalidIdentifierError,
    );

    expect(() => TestId.parse('123e4567-e89b-72d3-a456-426614174000')).toThrow(
      InvalidIdentifierError,
    );
  });

  it('returns undefined from tryParse for invalid input', () => {
    expect(TestId.tryParse('legacy-123')).toBeUndefined();
  });
});
