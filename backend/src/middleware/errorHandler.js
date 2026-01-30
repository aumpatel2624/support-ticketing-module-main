const { ApiError } = require('../utils/ApiError');

/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent error response
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
        console.error('Error has references:', !!err.references);
        if (err.references) {
            console.error('References:', err.references);
        }
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error = new ApiError(400, 'Invalid ID format');
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        error = new ApiError(409, `${field} already exists`);
    }

    // Mongoose validation error (NOT our custom ValidationError)
    // Check for Mongoose validation by looking for 'errors' property with validation details
    if (err.name === 'ValidationError' && err.errors && typeof err.errors === 'object') {
        const messages = Object.values(err.errors).map(e => e.message);
        error = new ApiError(400, 'Validation failed', messages);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new ApiError(401, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        error = new ApiError(401, 'Token expired');
    }

    // Default to 500 server error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    // Preserve references from original error (custom property)
    const references = err.references || error.references;

    const responseData = {
        success: false,
        error: message,
        details: error.details || null,
        // Include references if present (for cascading validation errors)
        ...(references && { references }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    if (process.env.NODE_ENV === 'development') {
        console.error('Response data:', JSON.stringify(responseData, null, 2));
    }

    res.status(statusCode).json(responseData);
};

/**
 * 404 Not Found Handler
 */
const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
};

module.exports = { errorHandler, notFound };
