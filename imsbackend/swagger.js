const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Inventory Management System API',
      version: '1.0.0',
      description: `API documentation for Smart Inventory Management System 📞 Phone: 0943662611`,
      contact: {
        name: "Kalayu Redae",
        email: "kalayuredae2@gmail.com",
      },
    },

    // Use relative URL so it works on shared hosting
    servers: [
      {
        url: '/api/ims',
        description: 'Live API Server (Relative Path)',
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

  // All route files containing Swagger annotations
  apis: ['./routes/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

// module.exports = (app) => {
//   // Make sure this comes **after your routes** are mounted
//   app.use(
//     '/api-docs',
//     swaggerUi.serve,
//     swaggerUi.setup(swaggerSpec, {
//       swaggerOptions: {
//         persistAuthorization: true,
//       },
//     })
//   );
// };

module.exports = (app) => {
  app.use(
    '/api-docs',
     swaggerUi.serve, (req, res) => {
    const swaggerSpec = swaggerJSDoc(options); // regenerate on each request
    swaggerUi.setup(swaggerSpec)(req, res);
  });
};