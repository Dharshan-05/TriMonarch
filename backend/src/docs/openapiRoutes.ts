export const openapiPaths = {
  '/health': {
    get: {
      tags: ['Operational'],
      summary: 'Docker Health Check',
      description: 'Canonical operational health check endpoint used by Docker containers',
      responses: {
        '200': { description: 'Service operational status' },
      },
    },
  },
  '/health/live': {
    get: {
      tags: ['Operational'],
      summary: 'Process Liveness Check',
      description: 'Lightweight liveness probe checking Node.js process responsiveness without DB queries',
      responses: {
        '200': { description: 'Application process is alive' },
      },
    },
  },
  '/health/ready': {
    get: {
      tags: ['Operational'],
      summary: 'Dependency Readiness Check',
      description: 'Readiness probe verifying PostgreSQL connection pool availability',
      responses: {
        '200': { description: 'Application ready to accept traffic' },
        '503': { description: 'Database dependency unavailable' },
      },
    },
  },
  '/metrics': {
    get: {
      tags: ['Operational'],
      summary: 'Prometheus Metrics Exporter',
      description: 'Exposes HTTP counter and duration metrics in OpenMetrics plain-text format',
      responses: {
        '200': { description: 'Prometheus metrics text response' },
      },
    },
  },
  '/api/v1/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User Authentication Login',
      description: 'Authenticates user credentials and returns JWT access and refresh tokens',
      requestBody: {
        required: true,
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
        '200': { description: 'Successful login' },
        '401': { description: 'Invalid credentials' },
      },
    },
  },
  '/api/v1/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh Access Token',
      description: 'Generates a new access token using a valid, non-revoked refresh token',
      responses: {
        '200': { description: 'Token refreshed successfully' },
        '401': { description: 'Invalid or revoked refresh token' },
      },
    },
  },
  '/api/v1/users': {
    get: {
      tags: ['Users'],
      summary: 'List Users',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Paginated list of users' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden' },
      },
    },
    post: {
      tags: ['Users'],
      summary: 'Create User',
      security: [{ bearerAuth: [] }],
      responses: {
        '201': { description: 'User created' },
        '400': { description: 'Validation error' },
      },
    },
  },
  '/api/v1/products': {
    get: {
      tags: ['Products'],
      summary: 'List Products',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Paginated list of products' },
      },
    },
    post: {
      tags: ['Products'],
      summary: 'Create Product',
      security: [{ bearerAuth: [] }],
      responses: {
        '201': { description: 'Product created' },
      },
    },
  },
  '/api/v1/partners': {
    get: {
      tags: ['Partners'],
      summary: 'List Customers and Suppliers',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Paginated list of partners' },
      },
    },
  },
  '/api/v1/inventory': {
    get: {
      tags: ['Inventory'],
      summary: 'List Inventory Balances',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Paginated inventory items' },
      },
    },
  },
  '/api/v1/sales-orders': {
    get: {
      tags: ['Sales Orders'],
      summary: 'List Sales Orders',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Paginated list of sales orders' },
      },
    },
  },
  '/api/v1/purchase-orders': {
    get: {
      tags: ['Purchase Orders'],
      summary: 'List Purchase Orders',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Paginated list of purchase orders' },
      },
    },
  },
  '/api/v1/bom': {
    get: {
      tags: ['Bills of Materials'],
      summary: 'List Bills of Materials',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Paginated list of BOMs' },
      },
    },
  },
  '/api/v1/manufacturing': {
    get: {
      tags: ['Manufacturing Orders'],
      summary: 'List Manufacturing Orders',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Paginated list of manufacturing orders' },
      },
    },
  },
  '/api/v1/audits': {
    get: {
      tags: ['Audit Logs'],
      summary: 'List Audit Logs',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Paginated audit events' },
      },
    },
  },
  '/api/v1/business-events': {
    get: {
      tags: ['Business Events'],
      summary: 'List Business Events',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Paginated business events' },
      },
    },
  },
};
