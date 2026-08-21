export const PROTOTYPE_POLLUTION_PAYLOADS = [
  { __proto__: { admin: true } },
  { constructor: { prototype: { isAdmin: true } } },
  JSON.parse('{"__proto__": {"polluted": true}}'),
];

export const MALFORMED_NUMERIC_PAYLOADS = [
  NaN,
  Infinity,
  -Infinity,
  -999.99,
  'not-a-number',
];

export const MALFORMED_UUID_PAYLOADS = [
  'invalid-uuid-123',
  '00000000-0000-0000-0000-00000000000Z',
  '12345',
];
