export const getOpenApiSpec = () => ({
  openapi: '3.0.3',
  info: {
    title: 'ERP Backend Service API',
    version: '1.0.0',
    description: 'Production-ready REST API for Enterprise Resource Planning (ERP) platform with JWT authentication & Audit Trail',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Endpoint',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'User Login',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authenticated successfully' },
          '401': { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get Current Authenticated User Profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Authenticated user profile' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'User Logout',
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Logged out successfully' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/audit': {
      get: {
        summary: 'List Audit Logs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'entity_type', in: 'query', schema: { type: 'string' } },
          { name: 'entity_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'user_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': { description: 'Paginated organization audit logs' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/audit/{id}': {
      get: {
        summary: 'Get Audit Log by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Audit log details' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Audit log not found' },
        },
      },
    },
    '/organizations': {
      get: {
        summary: 'List Organizations',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { '200': { description: 'Paginated organizations' } },
      },
      post: {
        summary: 'Create Organization',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code'],
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Organization created' } },
      },
    },
  },
});
