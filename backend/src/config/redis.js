const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis = null;

const getRedisUrl = () => {
    if (process.env.REDIS_URI) {
        return process.env.REDIS_URI;
    }
    return null;
};

const redisUrl = getRedisUrl();

if (redisUrl) {
    redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
            if (times > 10) {
                logger.warn('Redis: max retries reached, giving up');
                return null; // stop retrying
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true
    });

    redis.on('connect', () => {
        logger.info('Redis Connected');
    });

    redis.on('error', (err) => {
        logger.error(`Redis Connection Error: ${err.message}`);
    });

    // Attempt connection but don't crash if it fails
    redis.connect().catch((err) => {
        logger.warn(`Redis unavailable: ${err.message}. Running without Redis.`);
        redis = null;
    });
} else {
    logger.info('Redis URI not configured. Running without Redis (no caching, no Socket.io scaling).');
}

module.exports = {
    getClient: () => redis,
    isAvailable: () => redis !== null && redis.status === 'ready'
};
