declare const identifierBrand: unique symbol;

export type BrandedIdentifier<Name extends string> = string & {
  readonly [identifierBrand]: Name;
};

export type IdentifierCodec<TIdentifier extends string> = Readonly<{
  generate(): TIdentifier;
  parse(value: string): TIdentifier;
  tryParse(value: string): TIdentifier | undefined;
  toString(value: TIdentifier): string;
}>;

const canonicalUuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class InvalidIdentifierError extends Error {
  constructor(
    readonly identifierType: string,
    readonly input: string,
  ) {
    super(`Invalid ${identifierType}: expected canonical lowercase UUIDv4`);

    this.name = 'InvalidIdentifierError';
  }
}

export function isCanonicalUuidV4(value: string): boolean {
  return canonicalUuidV4Pattern.test(value);
}

function generateUuidV4(): string {
  const bytes = new Uint8Array(16);

  globalThis.crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

export function createUuidV4IdentifierCodec<TIdentifier extends string>(
  identifierType: string,
): IdentifierCodec<TIdentifier> {
  const parse = (value: string): TIdentifier => {
    if (!isCanonicalUuidV4(value)) {
      throw new InvalidIdentifierError(identifierType, value);
    }

    return value as TIdentifier;
  };

  return Object.freeze({
    generate(): TIdentifier {
      return parse(generateUuidV4());
    },

    parse,

    tryParse(value: string): TIdentifier | undefined {
      return isCanonicalUuidV4(value) ? (value as TIdentifier) : undefined;
    },

    toString(value: TIdentifier): string {
      return value;
    },
  });
}
