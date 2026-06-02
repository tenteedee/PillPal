import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'PillPal Backend API',
      version: '1.0.0',
      description: 'PillPal API docs generated from endpoint annotations.',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: {},
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/app.ts', './src/modules/**/*.routes.ts'],
};

export function getOpenApiSpec(): ReturnType<typeof swaggerJsdoc> {
  return swaggerJsdoc(swaggerOptions);
}

export function setupSwagger(app: Express): void {
  app.get('/api/v1/openapi.json', (_req, res) => {
    res.json(getOpenApiSpec());
  });

  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(getOpenApiSpec(), {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
  }));
}
