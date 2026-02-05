const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyparser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan=require("morgan")
const AppError = require("./utils/appError");
const globalErrorHandler = require('./controllers/errorController');

const bussinessRouter=require('./routes/businessRoutes');
const authRouter = require('./routes/authRoutes');
const roleRouter=require("./routes/roleRoutes");
const userRouter = require('./routes/userRoutes');
const wharehouseRouter = require('./routes/wharehouseRoutes');

const categoryRouter = require('./routes/categoryRoutes');
const brandRouter = require('./routes/brandRoutes');
const unitRouter = require('./routes/unitRoutes');
const productRouter = require('./routes/ProductRoutes');

const customerRouter = require('./routes/customerRoutes');
const supplierRouter = require('./routes/supplierRoutes');

const purchaseRouter = require('./routes/purchaseRoutes');
const purchaseReturnRouter=require('./routes/purchaseReturnRoutes')

// const saleRouter = require('./routes/saleRoutes');
// const saleItemRouter = require('./routes/saleItemRoutes');

//const stocktransferRouter = require('./routes/stockTransferRoutes');
// const stockAdjustmentRouter = require('./routes/stockAdjustmentRoutes');

// const transactionRouter = require('./routes/transactionRoutes');

const app = express(); //start Express app

const listEndpoints = require('express-list-endpoints');
// console.log(listEndpoints(app));

app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1 style="color:rgba(23, 204, 111, 1);">🌟Welcome to <strong> Grand Smart Inventory Managment System</strong>🌟</h1>
      <h2 style="color:rgba(46, 5, 104, 1);">Stay calm!</strong></h2>
    </div>
  `);
});

app.get("/ims", (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1 style="color:rgba(23, 204, 111, 1);">🌟Welcome to <strong>Inventory Managment System</strong>🌟</h1>
      <h2 style="color:rgba(46, 5, 104, 1);">Stay tuned for incredible changes ahead!</strong></h2>
    </div>
  `);
});


app.enable('trust proxy'); //Set trust proxy correctly based on whether your application is behind a proxy.

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// #1 Global Middlwares
// Implement CORS
// Postman usually sets null as the origin unless specified otherwise. 
// This may cause your server to reject requests if null is not included in the origin list.
let corsOptions;
if (process.env.NODE_ENV === 'production') {
  corsOptions = {
    origin: ['http://grandinventory.com','https://grandinventory.com',null], // Allowed origin for production
    credentials: true, // Enable credentials like cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE','OPTIONS'], // Add allowed methods
  };
} else {
  corsOptions = {
    origin: '*', // Allow all origins for development
    credentials: true, // Enable credentials like cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE','OPTIONS'], // Add allowed methods
  };
}

// Apply CORS middleware
app.use(cors(corsOptions));

// Serving static files
// app.use(express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Security HTTP Headers
app.use(helmet());
app.use(compression());

// Development logging
if (process.env.NODE_ENV === 'development') {
  //app.use(morgan('dev'));
  app.use(morgan("combined"))
}

//Limit requests from Same API (Configure rate limiting in express-rate-limit to use the correct IP source.)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  skip: (req, res) => {
    return true; // Always skip rate limiting, effectively making it infinite
  },
  keyGenerator: (req) => {
    return req.ip; // Use req.ip if not behind a proxy
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      message: options.message,
    });
  },
});
app.use(limiter); // Apply rate limiter to all routes

//Body parser, reading data from body into req.body
// app.use(bodyparser.json());no need to add
// // app.use(logmiddlware); // Apply log middleware to all routes
//app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.json()); // built-in middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['id'],
  })
);

// Test Middleware
app.use((req, res, next) => {
  req.requesttime = new Date().toLocaleString();
  next();
});


//  #2 Routers

app.use('/api/ims/business',bussinessRouter);
app.use('/api/ims/roles',roleRouter);
app.use('/api/ims/warehouses',wharehouseRouter);

app.use('/api/ims/users',userRouter);
app.use('/api/ims/auth',authRouter);

  //Swagger UI setup
app.use('/api/ims/categories',categoryRouter);
app.use('/api/ims/brands',brandRouter);
app.use('/api/ims/units',unitRouter);
app.use('/api/ims/products',productRouter);

app.use('/api/ims/customers',customerRouter);
app.use('/api/ims/suppliers',supplierRouter);

app.use('/api/ims/purchases',purchaseRouter);
app.use('/api/ims/purchase-returns',purchaseReturnRouter);

// app.use('/api/ims/sales',saleRouter);
// app.use('/api/ims/saleItems',saleItemRouter);

//app.use('/api/ims/stockAdjustments',stockAdjustmentRouter);
// app.use('/api/ims/transactions', transactionRouter);

// Catch-all route handler for undefined routes
//  app.all('*', (req, res, next) => {
//     next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

// Global error handling middleware
// app.use(globalErrorHandler);

module.exports = app;
