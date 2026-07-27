export function compareOrdinal(left, right) {
  const leftText = String(left);
  const rightText = String(right);

  if (leftText < rightText) {
    return -1;
  }

  if (leftText > rightText) {
    return 1;
  }

  return 0;
}

export function normalizeRepositoryPath(value) {
  const normalized = String(value).replaceAll('\\', '/');

  if (normalized === '.') {
    return '.';
  }

  return normalized
    .replace(/^\.\//, '')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
}

export function sortObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sortObjectKeys(item));
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort(compareOrdinal)
      .map((key) => [key, sortObjectKeys(value[key])]),
  );
}

export function stableStringify(value, { compact = false } = {}) {
  const spacing = compact ? 0 : 2;
  return `${JSON.stringify(sortObjectKeys(value), null, spacing)}\n`;
}
