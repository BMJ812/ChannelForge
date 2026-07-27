import { createHash } from 'node:crypto';

export type CanonicalJsonPrimitive = boolean | null | number | string;

export type CanonicalJsonValue =
  | CanonicalJsonPrimitive
  | CanonicalJsonValue[]
  | { [key: string]: CanonicalJsonValue };

function canonicalize(value: unknown, path: string): CanonicalJsonValue {
  if (value === null || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.normalize('NFC');
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Non-finite number at ${path}`);
    }

    return Object.is(value, -0) ? 0 : value;
  }

  if (value instanceof Date) {
    const milliseconds = value.getTime();

    if (!Number.isFinite(milliseconds)) {
      throw new TypeError(`Invalid Date at ${path}`);
    }

    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      canonicalize(item, `${path}[${index}]`),
    );
  }

  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);

    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`Unsupported object type at ${path}`);
    }

    const entries: Array<[string, CanonicalJsonValue]> = [];
    const normalizedKeys = new Set<string>();

    for (const [key, entryValue] of Object.entries(value)) {
      const normalizedKey = key.normalize('NFC');

      if (normalizedKeys.has(normalizedKey)) {
        throw new TypeError(`Duplicate normalized key at ${path}`);
      }

      normalizedKeys.add(normalizedKey);
      entries.push([
        normalizedKey,
        canonicalize(entryValue, `${path}.${normalizedKey}`),
      ]);
    }

    entries.sort(([left], [right]) => left.localeCompare(right));

    return Object.fromEntries(entries);
  }

  throw new TypeError(`Unsupported JSON value at ${path}`);
}

/**
 * Produces compact UTF-8 JSON with sorted object keys, preserved array order,
 * normalized Unicode, ISO Date values, and one trailing LF.
 */
export function serializeCanonicalJson(value: unknown): string {
  return `${JSON.stringify(canonicalize(value, '$'))}\n`;
}

export function checksumCanonicalJson(value: unknown): string {
  return createHash('sha256')
    .update(serializeCanonicalJson(value), 'utf8')
    .digest('hex');
}
