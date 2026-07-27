const REDACTED = '[REDACTED]';

const sensitiveJoinedKeys = new Set([
  'apikey',
  'authorization',
  'clientsecret',
  'cookie',
  'credential',
  'credentials',
  'password',
  'passphrase',
  'privatekey',
  'refreshtoken',
  'secret',
  'session',
  'sessionid',
  'token',
  'accesstoken',
]);

function tokenizeKey(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function isSensitiveKey(key) {
  const tokens = tokenizeKey(key);
  const joined = tokens.join('');

  if (sensitiveJoinedKeys.has(joined)) {
    return true;
  }

  return tokens.some((token) =>
    [
      'apikey',
      'authorization',
      'credential',
      'credentials',
      'cookie',
      'password',
      'passphrase',
      'privatekey',
      'secret',
      'session',
      'token',
    ].includes(token),
  );
}

export function redactText(input) {
  let text = String(input);

  text = text.replace(
    /-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g,
    '[REDACTED PRIVATE KEY]',
  );

  text = text.replace(
    /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi,
    '$1 [REDACTED]',
  );

  text = text.replace(
    /([a-z][a-z0-9+.-]*:\/\/)([^/\s:@]+):([^@\s/]+)@/gi,
    '$1[REDACTED]@',
  );

  text = text.replace(
    /([?&](?:access_token|api[_-]?key|client_secret|password|refresh_token|secret|session(?:id)?|token)=)[^&#\s]+/gi,
    '$1[REDACTED]',
  );

  text = text.replace(
    /(\b(?:access_token|api[_-]?key|authorization|client_secret|cookie|password|passphrase|private[_-]?key|refresh_token|secret|session(?:id)?|token)\b\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
    '$1[REDACTED]',
  );

  return text;
}

export function redactValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return redactText(value);
  }

  if (typeof value !== 'object') {
    return value;
  }

  const output = {};

  for (const [key, childValue] of Object.entries(value)) {
    output[key] = isSensitiveKey(key) ? REDACTED : redactValue(childValue);
  }

  return output;
}

export { REDACTED };
