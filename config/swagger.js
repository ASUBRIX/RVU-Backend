const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Royal Victorian University LMS API',
      version: '1.0.0',
      description: 'Royal Victorian University Learning Management System API Documentation - Comprehensive backend services for academic excellence and student success',
      contact: {
        name: 'RVU IT Support Team',
        email: 'it-support@royalvictorian.edu.au',
        url: 'https://www.royalvictorian.edu.au/support'
      },
      license: {
        name: 'Royal Victorian University',
        url: 'https://www.royalvictorian.edu.au/terms'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5001',
        description: 'Development server'
      },
      {
        url: 'https://api.royalvictorian.edu.au',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using Bearer scheme'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key for service authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User and admin authentication endpoints'
      },
      {
        name: 'Students',
        description: 'Student management and profile operations'
      },
      {
        name: 'Courses',
        description: 'Course catalog and enrollment management'
      },
      {
        name: 'Academic',
        description: 'Academic records, grades, and assessments'
      },
      {
        name: 'Administration',
        description: 'Administrative functions and reporting'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './routes/**/*.js',
    './models/*.js',
    './controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

/**
 * Configure Swagger documentation middleware for Royal Victorian University LMS
 * @param {Express} app - Express application instance
 */
const setupSwagger = (app) => {
  // Health check endpoint with university branding
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      service: 'Royal Victorian University LMS API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  });

  // Custom CSS with Royal Victorian University branding
  const customCss = `
    .swagger-ui .topbar { 
      background: #1a237e; 
      border-bottom: 3px solid #3949ab;
    }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info .title { 
      color: #1a237e; 
      font-size: 36px; 
      font-weight: 700;
      text-align: center;
      margin-bottom: 10px;
    }
    .swagger-ui .info .description { 
      font-size: 16px; 
      line-height: 1.8; 
      color: #424242;
      text-align: center;
      margin-bottom: 30px;
    }
    .swagger-ui .scheme-container { 
      background: linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%); 
      padding: 20px; 
      border-radius: 8px; 
      margin: 25px 0; 
      border-left: 4px solid #3949ab;
    }
    .swagger-ui .info::before {
      content: "🎓";
      font-size: 48px;
      display: block;
      text-align: center;
      margin-bottom: 20px;
    }
    .swagger-ui .btn.authorize {
      background-color: #3949ab;
      border-color: #3949ab;
    }
    .swagger-ui .btn.authorize:hover {
      background-color: #1a237e;
      border-color: #1a237e;
    }
    .swagger-ui .opblock.opblock-post {
      border-color: #3949ab;
      background: rgba(57, 73, 171, 0.1);
    }
    .swagger-ui .opblock.opblock-get {
      border-color: #00897b;
      background: rgba(0, 137, 123, 0.1);
    }
  `;

  // Setup Swagger UI with Royal Victorian University theming
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: customCss,
    customSiteTitle: 'Royal Victorian University LMS API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      persistAuthorization: true,
      displayOperationId: false,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      showExtensions: false,
      showCommonExtensions: false
    }
  }));

  // API Documentation JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(specs);
  });

  // Enhanced root route with Royal Victorian University branding
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 50px auto; padding: 30px; background: #f8f9fa; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="font-size: 64px; margin-bottom: 20px;">🎓</div>
          <h1 style="color: #1a237e; font-size: 42px; margin-bottom: 10px; font-weight: 700;">Royal Victorian University</h1>
          <h2 style="color: #3949ab; font-size: 28px; margin-bottom: 20px; font-weight: 400;">Learning Management System API</h2>
          <p style="color: #666; font-size: 18px; line-height: 1.6;">
            Empowering academic excellence through innovative technology solutions
          </p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; margin: 30px 0; border-left: 5px solid #3949ab;">
          <h3 style="color: #1a237e; margin-bottom: 25px; font-size: 24px;">🚀 Quick Access</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <a href="/api-docs" style="background: linear-gradient(135deg, #3949ab, #1a237e); color: white; padding: 15px 20px; text-decoration: none; border-radius: 8px; text-align: center; transition: transform 0.3s; display: block;">
              <div style="font-size: 20px; margin-bottom: 5px;">📚</div>
              <strong>API Documentation</strong>
            </a>
            <a href="/health" style="background: linear-gradient(135deg, #00897b, #004d40); color: white; padding: 15px 20px; text-decoration: none; border-radius: 8px; text-align: center; transition: transform 0.3s; display: block;">
              <div style="font-size: 20px; margin-bottom: 5px;">🏥</div>
              <strong>System Health</strong>
            </a>
            <a href="/api-docs.json" style="background: linear-gradient(135deg, #6c757d, #495057); color: white; padding: 15px 20px; text-decoration: none; border-radius: 8px; text-align: center; transition: transform 0.3s; display: block;">
              <div style="font-size: 20px; margin-bottom: 5px;">📄</div>
              <strong>OpenAPI Schema</strong>
            </a>
          </div>
        </div>

        <div style="background: #e3f2fd; padding: 25px; border-radius: 10px; margin: 30px 0;">
          <h3 style="color: #1a237e; margin-bottom: 20px; font-size: 20px;">🔗 API Endpoints</h3>
          <div style="color: #424242; line-height: 1.8;">
            <div style="margin-bottom: 12px;">
              <strong style="color: #3949ab;">Student Portal:</strong> 
              <code style="background: white; padding: 4px 8px; border-radius: 4px; margin-left: 10px;">/api/students</code>
            </div>
            <div style="margin-bottom: 12px;">
              <strong style="color: #3949ab;">Course Management:</strong> 
              <code style="background: white; padding: 4px 8px; border-radius: 4px; margin-left: 10px;">/api/courses</code>
            </div>
            <div style="margin-bottom: 12px;">
              <strong style="color: #3949ab;">Administrative Functions:</strong> 
              <code style="background: white; padding: 4px 8px; border-radius: 4px; margin-left: 10px;">/api/admin</code>
            </div>
            <div style="margin-bottom: 12px;">
              <strong style="color: #3949ab;">Authentication Services:</strong> 
              <code style="background: white; padding: 4px 8px; border-radius: 4px; margin-left: 10px;">/api/auth</code>
            </div>
          </div>
        </div>

        <div style="text-align: center; padding-top: 30px; border-top: 2px solid #e0e0e0; color: #666;">
          <p style="margin-bottom: 10px;">
            <strong>Royal Victorian University IT Department</strong>
          </p>
          <p style="font-size: 14px;">
            For technical support: <a href="mailto:it-support@royalvictorian.edu.au" style="color: #3949ab;">it-support@royalvictorian.edu.au</a>
          </p>
          <p style="font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} Royal Victorian University. All rights reserved.
          </p>
        </div>
      </div>
    `);
  });

  // University information endpoint
  app.get('/university-info', (req, res) => {
    res.json({
      name: 'Royal Victorian University',
      established: '1998',
      location: 'Melbourne, Victoria, Australia',
      website: 'https://www.royalvictorian.edu.au',
      lms_version: '1.0.0',
      api_documentation: `${req.protocol}://${req.get('host')}/api-docs`,
      support_contact: 'it-support@royalvictorian.edu.au'
    });
  });
};

module.exports = {
  setupSwagger,
  specs,
  swaggerUi
};