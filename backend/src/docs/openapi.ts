import { Router, Request, Response } from 'express';
import { openapiSchemas } from './openapiSchemas';
import { openapiPaths } from './openapiRoutes';

export const openapiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'TriMonarch ERP API',
    version: '1.0.0',
    description: 'Production-grade OpenAPI 3.1 Specification for TriMonarch ERP Backend Services',
    contact: {
      name: 'TriMonarch Engineering Team',
      email: 'engineering@trimonarch.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Primary API v1 Server',
    },
  ],
  paths: openapiPaths,
  components: {
    schemas: openapiSchemas,
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT Access Token in Authorization header (Bearer <token>)',
      },
    },
  },
};

export const getOpenApiSpec = () => openapiDocument;

const router = Router();

router.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(openapiDocument);
});

router.get('/api-docs', (_req: Request, res: Response) => {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TriMonarch ERP API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(htmlContent);
});

export default router;
