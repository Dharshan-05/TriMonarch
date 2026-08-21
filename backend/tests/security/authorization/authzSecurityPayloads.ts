export const FORGED_AUTH_PAYLOADS = [
  { role: 'SUPER_ADMIN', isAdmin: true, permissions: ['*'] },
  { organizationId: 'attacker-org-999', userId: 'admin-user-999' },
  { permissions: ['audit:manage', 'user:delete', 'system:*'] },
];

export const WILDCARD_PERMISSION_PAYLOADS = [
  '*',
  'admin',
  'product:*',
  'manufacturing:*',
  'bom:*',
  null,
  undefined,
];
