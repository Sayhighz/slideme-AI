/**
 * HTTP status codes with descriptions
 */

export const STATUS_CODES = {
    // Success codes
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    
    // Client error codes
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    
    // Server error codes
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
  };
  
  /**
   * Get status code description
   * @param {number} code - HTTP status code
   * @returns {string} Status code description
   */
  export const getStatusCodeDescription = (code) => {
    switch (code) {
      case STATUS_CODES.OK:
        return 'OK';
      case STATUS_CODES.CREATED:
        return 'Created';
      case STATUS_CODES.ACCEPTED:
        return 'Accepted';
      case STATUS_CODES.NO_CONTENT:
        return 'No Content';
      case STATUS_CODES.BAD_REQUEST:
        return 'Bad Request';
      case STATUS_CODES.UNAUTHORIZED:
        return 'Unauthorized';
      case STATUS_CODES.FORBIDDEN:
        return 'Forbidden';
      case STATUS_CODES.NOT_FOUND:
        return 'Not Found';
      case STATUS_CODES.METHOD_NOT_ALLOWED:
        return 'Method Not Allowed';
      case STATUS_CODES.CONFLICT:
        return 'Conflict';
      case STATUS_CODES.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity';
      case STATUS_CODES.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case STATUS_CODES.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      case STATUS_CODES.NOT_IMPLEMENTED:
        return 'Not Implemented';
      case STATUS_CODES.BAD_GATEWAY:
        return 'Bad Gateway';
      case STATUS_CODES.SERVICE_UNAVAILABLE:
        return 'Service Unavailable';
      case STATUS_CODES.GATEWAY_TIMEOUT:
        return 'Gateway Timeout';
      default:
        return 'Unknown Status Code';
    }
  };