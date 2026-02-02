const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticate = asyncHandler(async (req, res, next) => {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Fallback: Get token from query parameter (for browser downloads)
    if (!token && req.query.token) {
        token = req.query.token;
    }

    // Check if token exists
    if (!token) {
        throw new AuthenticationError('No token provided, authorization denied');
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        if (!user.isActive) {
            throw new AuthenticationError('Account is deactivated');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new AuthenticationError('Invalid token');
        }
        if (error.name === 'TokenExpiredError') {
            throw new AuthenticationError('Token expired');
        }
        throw error;
    }
});

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Fallback: Get token from query parameter
    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (user && user.isActive) {
                req.user = user;
            }
        } catch (error) {
            // Silently fail for optional auth
        }
    }

    next();
});

module.exports = { authenticate, optionalAuth };
