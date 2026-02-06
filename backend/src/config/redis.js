const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis = null;
let redisAvailable = false;

const redisUrl = process.env.REDIS_URI || '';

// Only attempt Redis if a real URI is provided (not empty, not localhost without a running server)
if (redisUrl && redisUrl.trim() !== '') {
    try {
        redis = new Redis(redisUrl, {
            retryStrategy: (times) => {
                if (times > 5) {
                    logger.warn('Redis: max retries reached, disabling Redis.');
                    redisAvailable = false;
                    return null; // stop retrying
                }
                return Math.min(times * 200, 2000);
            },
            maxRetriesPerRequest: null, // prevent MaxRetriesPerRequestError crashes
            enableOfflineQueue: false,  // don't queue commands when disconnected
            lazyConnect: true
        });

        redis.on('connect', () => {
            redisAvailable = true;
            logger.info('Redis Connected');
        });

        redis.on('error', (err) => {
            logger.error(`Redis Connection Error: ${err.message}`);
        });

        redis.on('close', () => {
            redisAvailable = false;
        });

        redis.on('end', () => {
            redisAvailable = false;
        });

        // Try connecting once
        redis.connect().then(() => {
            redisAvailable = true;
        }).catch((err) => {
            logger.warn(`Redis unavailable: ${err.message}. Running without Redis.`);
            redisAvailable = false;
            // Disconnect to stop reconnection attempts
            redis.disconnect();
            redis = null;
        });
    } catch (err) {
        logger.warn(`Redis init failed: ${err.message}. Running without Redis.`);
        redis = null;
        redisAvailable = false;
    }
} else {
    logger.info('REDIS_URI not set. Running without Redis (no caching, no Socket.io scaling).');
}

/**
 * Create a duplicate Redis client with proper error handling.
 * Returns null if Redis is not available.
 */
const createDuplicate = () => {
    if (!redis || !redisAvailable) return null;
    try {
        const dup = redis.duplicate();
        dup.on('error', (err) => {
            logger.error(`Redis duplicate client error: ${err.message}`);
        });
        return dup;
    } catch (err) {
        logger.warn(`Failed to duplicate Redis client: ${err.message}`);
        return null;
    }
};

module.exports = {
    getClient: () => redis,
    isAvailable: () => redisAvailable && redis !== null,
    createDuplicate
};
