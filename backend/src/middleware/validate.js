const { z } = require('zod');
const { ValidationError } = require('../utils/ApiError');

/**
 * Zod Validation Middleware
 * Validates request body, query, or params against Zod schema
 */

/**
 * Validate request body
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            // Validate schema is provided and has parse method
            if (!schema || typeof schema.parse !== 'function') {
                console.error('[validateBody] ERROR: Invalid schema provided:', schema);
                throw new Error('Invalid schema: schema is undefined or does not have a parse method');
            }

            const validated = schema.parse(req.body);
            req.body = validated;
            next();
        } catch (error) {
            // Check if it's a ZodError with the expected structure
            if (error instanceof z.ZodError && Array.isArray(error.errors)) {
                const details = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                throw new ValidationError('Validation failed', details);
            }
            // Re-throw non-ZodErrors as-is
            throw error;
        }
    };
};

/**
 * Validate request query parameters
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            // Validate schema is provided and has parse method
            if (!schema || typeof schema.parse !== 'function') {
                console.error('[validateQuery] ERROR: Invalid schema provided:', schema);
                throw new Error('Invalid schema: schema is undefined or does not have a parse method');
            }

            const validated = schema.parse(req.query);
            // In Express 5, req.query is a getter. We use defineProperty to overwrite it.
            Object.defineProperty(req, 'query', {
                value: validated,
                writable: true,
                enumerable: true,
                configurable: true
            });
            next();
        } catch (error) {
            // Check if it's a ZodError with the expected structure
            if (error instanceof z.ZodError && Array.isArray(error.errors)) {
                const details = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                throw new ValidationError('Query validation failed', details);
            }
            // Re-throw non-ZodErrors as-is
            throw error;
        }
    };
};

/**
 * Validate request params
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            // Validate schema is provided and has parse method
            if (!schema || typeof schema.parse !== 'function') {
                console.error('[validateParams] ERROR: Invalid schema provided:', schema);
                throw new Error('Invalid schema: schema is undefined or does not have a parse method');
            }

            const validated = schema.parse(req.params);
            // In Express 5, req.params might be a getter. We use defineProperty to overwrite it.
            Object.defineProperty(req, 'params', {
                value: validated,
                writable: true,
                enumerable: true,
                configurable: true
            });
            next();
        } catch (error) {
            // Check if it's a ZodError with the expected structure
            if (error instanceof z.ZodError && Array.isArray(error.errors)) {
                const details = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                throw new ValidationError('Params validation failed', details);
            }
            // Re-throw non-ZodErrors as-is
            throw error;
        }
    };
};

module.exports = {
    validateBody,
    validateQuery,
    validateParams
};
