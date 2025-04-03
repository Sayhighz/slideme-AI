/**
 * Swagger API documentation configuration
 */
import path from 'path';
import { fileURLToPath } from 'url';
import env from './env.js';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define Swagger options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SlideMe API Documentation',
      version: '1.0.0',
      description: `
        ## SlideMe API
        
        This is the API documentation for the SlideMe application, which provides
        services for connecting customers with slide service providers.
        
        ### Authentication
        
        Most endpoints require authentication. Use the /auth endpoints to obtain a JWT token.
        
        ### Error Responses
        
        Error responses follow a standard format:
        
        \`\`\`json
        {
          "Status": false,
          "Error": "Error message"
        }
        \`\`\`
        
        ### Success Responses
        
        Success responses typically include:
        
        \`\`\`json
        {
          "Status": true,
          "Message": "Success message",
          "Result": [...]
        }
        \`\`\`
      `,
      contact: {
        name: 'SlideMe Support',
        email: 'support@slideme.app'
      }
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  Status: {
                    type: 'boolean',
                    example: false
                  },
                  Error: {
                    type: 'string',
                    example: 'Unauthorized'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  Status: {
                    type: 'boolean',
                    example: false
                  },
                  Error: {
                    type: 'string',
                    example: 'Resource not found'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  Status: {
                    type: 'boolean',
                    example: false
                  },
                  Error: {
                    type: 'string',
                    example: 'Validation failed'
                  },
                  details: {
                    type: 'array',
                    items: {
                      type: 'string'
                    },
                    example: ['Field is required', 'Value is invalid']
                  }
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  Status: {
                    type: 'boolean',
                    example: false
                  },
                  Error: {
                    type: 'string',
                    example: 'Internal server error'
                  }
                }
              }
            }
          }
        }
      },
      schemas: {
        Customer: {
          type: 'object',
          properties: {
            customer_id: {
              type: 'integer',
              example: 123
            },
            phone_number: {
              type: 'string',
              example: '0812345678'
            },
            email: {
              type: 'string',
              example: 'user@example.com'
            },
            first_name: {
              type: 'string',
              example: 'John'
            },
            last_name: {
              type: 'string',
              example: 'Doe'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z'
            }
          }
        },
        Driver: {
          type: 'object',
          properties: {
            driver_id: {
              type: 'integer',
              example: 456
            },
            phone_number: {
              type: 'string',
              example: '0891234567'
            },
            first_name: {
              type: 'string',
              example: 'Jane'
            },
            last_name: {
              type: 'string',
              example: 'Smith'
            },
            license_plate: {
              type: 'string',
              example: 'ABC123'
            },
            approval_status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              example: 'approved'
            },
            created_date: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z'
            }
          }
        },
        ServiceRequest: {
          type: 'object',
          properties: {
            request_id: {
              type: 'integer',
              example: 789
            },
            customer_id: {
              type: 'integer',
              example: 123
            },
            location_from: {
              type: 'string',
              example: 'Central World'
            },
            location_to: {
              type: 'string',
              example: 'Siam Paragon'
            },
            pickup_lat: {
              type: 'number',
              format: 'float',
              example: 13.7462
            },
            pickup_long: {
              type: 'number',
              format: 'float',
              example: 100.5401
            },
            dropoff_lat: {
              type: 'number',
              format: 'float',
              example: 13.7466
            },
            dropoff_long: {
              type: 'number',
              format: 'float',
              example: 100.5331
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'completed', 'cancelled'],
              example: 'pending'
            },
            request_time: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T14:30:00Z'
            },
            booking_time: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T15:00:00Z'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/**/*.js')
  ]
};

export default swaggerOptions;