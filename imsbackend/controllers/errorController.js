const AppError = require("../utils/appError");
// const { logError } = require('../utils/logUtils');
const { ValidationError, UniqueConstraintError, DatabaseError } = require('sequelize');

// Sequelize-specific handlers
const handleSequelizeValidationError = (err) => {
  // Detect MySQL duplicate entry
  if (err.parent && err.parent.code === "ER_DUP_ENTRY") {

    const match = err.parent.sqlMessage.match(/Duplicate entry '(.+)' for key '(.+)'/);

    const value = match ? match[1] : "";
    const field = match ? match[2] : "field";

    return new AppError(
      `Duplicate value '${value}' for ${field}. Please use another value.`,
      400
    );
  }

  const messages = err.errors.map(e => e.message);
  const message = `Validation error: ${messages.join(". ")}`;

  return new AppError(message, 400);
};

const handleSequelizeUniqueConstraintError = (err) => {
  const field = err.errors[0]?.path;
  const value = err.errors[0]?.value;
  return new AppError(`${field} '${value}' already exists`, 400);

};
const handleSequelizeDatabaseError = (err) => {

  if (err.parent && err.parent.code === "ER_DUP_ENTRY") {
    return new AppError("Duplicate record already exists.", 400);
  }

  return new AppError(`Database error: ${err.message}`, 500);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Send error response in development
const sendErrorDev = (err, req, res) => {
  console.error('Error:', {
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
    errorType: err.errorType,
    stack: err.stack
  });

  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });

};

// Send error response in production
const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  return res.status(500).json({
    status: 0,
    statusCode: 500,
    message: 'Something went wrong. Please try again later.',
    errorType: 'Unknown error'
  });
};

// Global error handler middleware
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  // logError(err, req);adjust after you create log model

  err.statusCode = err.statusCode || 500;
  err.status = err.status ?? 0;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, message: err.message };

    // Sequelize errors
    if (err instanceof ValidationError) {
      error = handleSequelizeValidationError(err);
      error.isOperational = true;
    } else if (err instanceof UniqueConstraintError) {
      error = handleSequelizeUniqueConstraintError(err);
      error.isOperational = true;
    } else if (err instanceof DatabaseError) {
      error = handleSequelizeDatabaseError(err);
      error.isOperational = true;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
      error.isOperational = true;
    }

    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
      error.isOperational = true;
    }

    sendErrorProd(error, req, res);
  }
};
