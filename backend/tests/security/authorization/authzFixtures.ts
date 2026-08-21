export const authzOrgA = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Authz Org A',
};

export const authzOrgB = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Authz Org B',
};

export const authzUserA = {
  id: '33333333-3333-3333-3333-333333333333',
  organizationId: authzOrgA.id,
  roles: ['EMPLOYEE'],
};

export const authzAdminA = {
  id: '55555555-5555-5555-5555-555555555555',
  organizationId: authzOrgA.id,
  roles: ['ADMIN'],
};
