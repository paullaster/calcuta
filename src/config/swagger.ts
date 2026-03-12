import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BoxMetric API',
      version: '1.0.0',
      description: 'Material Intelligence & Structural Engineering API for the Corrugated Packaging Industry',
      contact: {
        name: 'BoxMetric Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3450',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: ['./src/interfaces/controllers/*.ts', './src/interfaces/router.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
