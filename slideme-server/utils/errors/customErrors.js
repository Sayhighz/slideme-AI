/**
 * Custom error classes for better error handling
 */

/**
 * Base custom error class
 */
export class CustomError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.name = this.constructor.name;
      this.statusCode = statusCode;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Not found error
   */
  export class NotFoundError extends CustomError {
    constructor(message = 'Resource not found') {
      super(message, 404);
      this.name = 'NotFoundError';
    }
  }
  
  /**
   * Validation error
   */
  export class ValidationError extends CustomError {
    constructor(message = 'Validation failed', errors = []) {
      super(message, 400);
      this.name = 'ValidationError';
      this.errors = errors;
    }
  }
  
  /**
   * Unauthorized error
   */
  export class UnauthorizedError extends CustomError {
    constructor(message = 'Unauthorized') {
      super(message, 401);
      this.name = 'UnauthorizedError';
    }
  }
  
  /**
   * Forbidden error
   */
  export class ForbiddenError extends CustomError {
    constructor(message = 'Forbidden') {
      super(message, 403);
      this.name = 'ForbiddenError';
    }
  }
  
  /**
   * Database error
   */
  export class DatabaseError extends CustomError {
    constructor(message = 'Database error occurred', originalError = null) {
      super(message, 500);
      this.name = 'DatabaseError';
      this.originalError = originalError;
    }
  }