/**
 * Custom API Error Classes
 * Provides structured error handling with appropriate HTTP status codes
 */

class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.success = false;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends ApiError {
    constructor(message, details = null) {
        super(400, message, details);
        this.name = 'ValidationError';
    }
}

class AuthenticationError extends ApiError {
    constructor(message = 'Authentication failed') {
        super(401, message);
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends ApiError {
    constructor(message = 'Access denied') {
        super(403, message);
        this.name = 'AuthorizationError';
    }
}

class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(404, message);
        this.name = 'NotFoundError';
    }
}

class ConflictError extends ApiError {
    constructor(message = 'Resource already exists') {
        super(409, message);
        this.name = 'ConflictError';
    }
}

module.exports = {
    ApiError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError
};
