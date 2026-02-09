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

// Debug S3 Configuration (Safe Logging)
const safeLog = (label, value) => {
  if (!value) return console.log(`[S3 Config] ${label}: <MISSING>`);
  if (label.includes('KEY') || label.includes('SECRET')) {
    return console.log(`[S3 Config] ${label}: ${value.substring(0, 4)}...${value.substring(value.length - 4)} (Length: ${value.length})`);
  }
  console.log(`[S3 Config] ${label}: ${value}`);
};

console.log('--- S3 Configuration Check ---');
safeLog('AWS_REGION', process.env.AWS_REGION);
safeLog('S3_BUCKET_NAME', process.env.S3_BUCKET_NAME);
safeLog('AWS_ACCESS_KEY_ID', process.env.AWS_ACCESS_KEY_ID);
safeLog('AWS_SECRET_ACCESS_KEY', process.env.AWS_SECRET_ACCESS_KEY);
console.log('------------------------------');

module.exports = s3Client;
