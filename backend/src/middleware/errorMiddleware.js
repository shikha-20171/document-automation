/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg, errors = []) {
    return new ApiError(400, msg, errors);
  }

  static unauthorized(msg = "Unauthorized access.") {
    return new ApiError(401, msg);
  }

  static forbidden(msg = "Forbidden. Insufficient permissions.") {
    return new ApiError(403, msg);
  }

  static notFound(msg = "Resource not found.") {
    return new ApiError(404, msg);
  }

  static conflict(msg = "Resource already exists.") {
    return new ApiError(409, msg);
  }

  static internal(msg = "Internal server error.") {
    return new ApiError(500, msg);
  }
}

/**
 * Global Error Handler Middleware
 */
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  // Handle Multer errors
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size exceeds the allowed limit (max 30MB).";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded in a single request.";
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid access token.";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Access token has expired.";
  }

  // Handle Prisma Database errors
  if (err.code === "P2002") {
    statusCode = 409;
    const target = err.meta?.target ? ` on field (${err.meta.target})` : "";
    message = `A duplicate record already exists${target}.`;
  } else if (err.code === "P2025") {
    statusCode = 404;
    message = "The requested record was not found in the database.";
  } else if (err.code === "P2003") {
    statusCode = 400;
    message = "Foreign key constraint failed. Related record does not exist.";
  }

  // Handle Express JSON syntax errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON body payload.";
  }

  if (statusCode >= 500) {
    console.error("Unhandled Server Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorMiddleware;
module.exports.ApiError = ApiError;