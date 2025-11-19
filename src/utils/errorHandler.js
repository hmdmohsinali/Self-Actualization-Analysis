/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle MongoDB duplicate key errors
 * @param {Error} error - MongoDB error
 * @returns {AppError} Formatted error
 */
export const handleDuplicateKeyError = (error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return new AppError(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`, 409);
  }
  return error;
};

/**
 * Handle MongoDB validation errors
 * @param {Error} error - MongoDB error
 * @returns {AppError} Formatted error
 */
export const handleValidationError = (error) => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return new AppError(messages.join(", "), 400);
  }
  return error;
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error("Error:", err);

  // Handle specific error types
  if (err.name === "ValidationError") {
    error = handleValidationError(err);
  }

  if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }

  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Token expired", 401);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

