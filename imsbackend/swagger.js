const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Inventory Managment System API',
      version: '1.0.0',
    description: `API documentation for Smart Inventory Management System  📞 Phone: 0943662611`,    
    contact: {
      name: "Kalayu Redae",
      email: "kalayuredae2@gmail.com",
      url: "https://grandinventory.com"
        }
    },

    servers: [
      {
        url: 'http://localhost:8083/api/ims',
        description: 'Local Server'
      },
      {
        url: 'https:grandinventory.com',
        description: 'Remote Server',
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

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ['./routes/**/*.js'], // all route files
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = (app) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
};