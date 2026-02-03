const Redis = require('ioredis');
const logger = require('../utils/logger');

const getRedisUrl = () => {
    if (process.env.REDIS_URI) {
        return process.env.REDIS_URI;
    }
    return 'redis://localhost:6379';
};

const redis = new Redis(getRedisUrl(), {
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3
});

redis.on('connect', () => {
    logger.info('Redis Connected');
});

redis.on('error', (err) => {
    logger.error(`Redis Connection Error: ${err}`);
});

module.exports = redis;
