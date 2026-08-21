export const MALFORMED_JWT_PAYLOADS = [
  'invalid.jwt.token',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid_signature',
  'eyJhbGciOiJub25lIiwidHlwZSI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.',
];

export const MALFORMED_CREDENTIAL_PAYLOADS = [
  { email: '', password: '' },
  { email: 'not-an-email', password: 'short' },
  { email: 'user@example.com', password: 'a'.repeat(200) },
];
