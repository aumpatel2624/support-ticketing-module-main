const redis = require('../config/redis');

/**
 * Cache middleware
 * @param {number} duration - Cache duration in seconds
 * @returns {function} Express middleware
 */
const cache = (duration) => {
    return async (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generate cache key
        // Include user ID to ensure data isolation (since stats depend on user role/dept)
        const userId = req.user ? req.user._id.toString() : 'public';
        const key = `cache:${req.originalUrl}:${userId}`;

        try {
            const cachedResponse = await redis.get(key);

            if (cachedResponse) {
                // Determine if we need to parse it or send strictly string
                // Ideally store as stringified JSON
                res.setHeader('X-Cache', 'HIT');
                return res.json(JSON.parse(cachedResponse));
            }

            // If not cached, override res.json to capture response
            const originalJson = res.json;
            res.json = (body) => {
                // Restore original method to avoid infinite loop if called again
                res.json = originalJson;

                // Cache the response asynchronously
                // We don't await this to avoid delaying the response
                redis.setex(key, duration, JSON.stringify(body)).catch(err => {
                    console.error('Redis cache set error:', err);
                });

                res.setHeader('X-Cache', 'MISS');
                return originalJson.call(res, body);
            };

            next();
        } catch (error) {
            console.error('Redis cache middleware error:', error);
            // If redis fails, just proceed without caching
            next();
        }
    };
};

module.exports = cache;
