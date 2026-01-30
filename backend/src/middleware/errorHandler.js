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

    // Mongoose validation error
    if (err.name === 'ValidationError') {
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

    res.status(statusCode).json({
        success: false,
        error: message,
        details: error.details || null,
        // Include references if present (for cascading validation errors)
        ...(error.references && { references: error.references }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
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
