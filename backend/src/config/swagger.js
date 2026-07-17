// Swagger dependencies (install with: npm install swagger-jsdoc swagger-ui-express --save-dev)
let swaggerJsdoc, swaggerUi;

try {
  swaggerJsdoc = require('swagger-jsdoc');
  swaggerUi = require('swagger-ui-express');
} catch (error) {
  // Swagger dependencies not installed - return no-op function
  console.warn('Swagger dependencies not installed. Run: npm install swagger-jsdoc swagger-ui-express --save-dev');
  module.exports = () => {}; // No-op if dependencies not installed
  return;
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inavora API',
      version: '1.0.0',
      description: 'API documentation for Inavora - Interactive Presentation Platform',
      contact: {
        name: 'API Support',
        email: 'support@inavora.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:4001',
        description: 'Development server'
      },
      {
        url: 'https://api.inavora.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            },
            code: {
              type: 'string',
              example: 'VALIDATION_ERROR'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Validation error message'
            },
            code: {
              type: 'string',
              example: 'VALIDATION_ERROR'
            }
          }
        },
        UnauthorizedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Unauthorized'
            },
            code: {
              type: 'string',
              example: 'UNAUTHORIZED'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            email: {
              type: 'string',
              example: 'user@example.com'
            },
            displayName: {
              type: 'string',
              example: 'John Doe'
            },
            photoURL: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/photo.jpg'
            },
            subscription: {
              type: 'object',
              properties: {
                plan: {
                  type: 'string',
                  enum: ['free', 'pro', 'lifetime', 'institution'],
                  example: 'pro'
                },
                status: {
                  type: 'string',
                  enum: ['active', 'expired', 'cancelled'],
                  example: 'active'
                }
              }
            }
          }
        },
        Presentation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            title: {
              type: 'string',
              example: 'My Presentation'
            },
            accessCode: {
              type: 'string',
              example: 'ABC123'
            },
            isLive: {
              type: 'boolean',
              example: false
            },
            currentSlideIndex: {
              type: 'number',
              example: 0
            },
            showResults: {
              type: 'boolean',
              example: false
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            }
          }
        }
      },
      responses: {
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        UnauthorizedError: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnauthorizedError'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      },
      {
        name: 'Presentations',
        description: 'Presentation management'
      },
      {
        name: 'Slides',
        description: 'Slide management'
      },
      {
        name: 'Payments',
        description: 'Payment and subscription management'
      },
      {
        name: 'Careers',
        description: 'Job application endpoints'
      },
      {
        name: 'Admin',
        description: 'Admin endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/server.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Inavora API Documentation'
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = swaggerSetup;

