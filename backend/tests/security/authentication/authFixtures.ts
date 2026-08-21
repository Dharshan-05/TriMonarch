export const authOrgA = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Auth Org A',
};

export const authOrgB = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Auth Org B',
};

export const authUserA = {
  id: '33333333-3333-3333-3333-333333333333',
  organization_id: authOrgA.id,
  email: 'autha@example.com',
  status: 'active',
};

export const authUserB = {
  id: '44444444-4444-4444-4444-444444444444',
  organization_id: authOrgB.id,
  email: 'authb@example.com',
  status: 'active',
};
