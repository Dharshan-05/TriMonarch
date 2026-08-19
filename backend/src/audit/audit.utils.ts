const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'passwordhash',
  'accesstoken',
  'refreshtoken',
  'token',
  'authorization',
  'cookie',
  'jwt',
  'secret',
  'apikey',
  'clientsecret',
]);

export const redactSensitiveData = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  if (typeof data === 'object') {
    const redactedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        redactedObj[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redactedObj[key] = redactSensitiveData(value);
      } else {
        redactedObj[key] = value;
      }
    }
    return redactedObj;
  }

  return data;
};

export const computeDiff = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { before: unknown; after: unknown }> => {
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const key of allKeys) {
    if (['id', 'created_at', 'updated_at'].includes(key)) {
      continue;
    }
    const valBefore = before[key];
    const valAfter = after[key];

    if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
      const redactedBeforeObj = redactSensitiveData({ [key]: valBefore }) as Record<string, unknown>;
      const redactedAfterObj = redactSensitiveData({ [key]: valAfter }) as Record<string, unknown>;

      diff[key] = {
        before: valBefore !== undefined ? redactedBeforeObj[key] : null,
        after: valAfter !== undefined ? redactedAfterObj[key] : null,
      };
    }
  }

  return diff;
};
