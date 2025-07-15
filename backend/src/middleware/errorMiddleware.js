const { logger, logSecurityEvent } = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found middleware
const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Sequelize error handler
const handleSequelizeError = (err) => {
  let error = { ...err };
  error.message = err.message;

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Sequelize database connection error
  if (err.name === 'SequelizeConnectionError') {
    const message = 'Database connection failed';
    error = new AppError(message, 500);
  }

  // Sequelize timeout error
  if (err.name === 'SequelizeTimeoutError') {
    const message = 'Database operation timed out';
    error = new AppError(message, 500);
  }

  return error;
};

// JWT error handler
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again!', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired! Please log in again.', 401);
};

// Mongoose cast error handler
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Send error response for development
const sendErrorDev = (err, req, res) => {
  // Log error for development
  logger.error('Error:', {
    error: err,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });

  // API error response
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode || 500).json({
      status: err.status || 'error',
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Rendered website error
  res.status(err.statusCode || 500).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

// Send error response for production
const sendErrorProd = (err, req, res) => {
  // Log error for production
  logger.error('Error:', {
    message: err.message,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.id,
    tenant: req.tenant?.id
  });

  // API error response
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }

  // Rendered website error
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR:', err);
    res.status(500).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later.'
    });
  }
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log security-related errors
  if (err.statusCode === 401 || err.statusCode === 403) {
    logSecurityEvent('UNAUTHORIZED_ACCESS', {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user?.id
    });
  }

  // Handle different error types
  if (err.name === 'CastError') error = handleCastError(error);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (err.name && err.name.startsWith('Sequelize')) error = handleSequelizeError(error);

  // Handle specific error codes
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = new AppError(message, 400);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    const message = errors.join('. ');
    error = new AppError(message, 400);
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response helper
const sendErrorResponse = (res, statusCode, message, details = null) => {
  const response = {
    status: 'error',
    message,
    statusCode
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

// Success response helper
const sendSuccessResponse = (res, statusCode, message, data = null) => {
  const response = {
    status: 'success',
    message,
    statusCode
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  AppError,
  notFound,
  errorHandler,
  asyncHandler,
  sendErrorResponse,
  sendSuccessResponse
};