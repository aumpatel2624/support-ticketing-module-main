const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Initialize AWS S3 Client
 * Uses credentials from environment variables:
 * - AWS_REGION
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = s3Client;
