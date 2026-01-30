const sanitize = require('mongo-sanitize');
const xss = require('xss');

/**
 * Helper to safely update Express request objects (query/params)
 * Handles Express 5 getter restrictions
 */
const safeUpdate = (req, prop, value) => {
    try {
        req[prop] = value;
    } catch (e) {
        Object.defineProperty(req, prop, {
            value: value,
            writable: true,
            enumerable: true,
            configurable: true
        });
    }
};

/**
 * Middleware to sanitize data against NoSQL query injection
 * Uses mongo-sanitize to strip out keys starting with $
 */
const mongoSanitize = () => {
    return (req, res, next) => {
        if (req.body) req.body = sanitize(req.body);
        if (req.query) safeUpdate(req, 'query', sanitize(req.query));
        if (req.params) safeUpdate(req, 'params', sanitize(req.params));
        next();
    };
};

/**
 * Recursive function to clean XSS from objects/strings
 */
const cleanXss = (data) => {
    if (!data) return data;
    if (typeof data === 'string') return xss(data);
    if (Array.isArray(data)) return data.map(cleanXss);
    if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
            data[key] = cleanXss(data[key]);
        });
    }
    return data;
};

/**
 * Middleware to sanitize data against XSS attacks
 */
const xssSanitize = () => {
    return (req, res, next) => {
        if (req.body) req.body = cleanXss(req.body);
        if (req.query) safeUpdate(req, 'query', cleanXss(req.query));
        if (req.params) safeUpdate(req, 'params', cleanXss(req.params));
        next();
    };
};

module.exports = {
    mongoSanitize,
    xssSanitize
};
