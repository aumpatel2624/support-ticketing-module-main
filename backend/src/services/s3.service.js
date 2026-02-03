const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');
const logger = require('../utils/logger');

/**
 * S3 Service - Handles all S3 operations
 */
class S3Service {
  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME;
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.folderPrefix = process.env.S3_FOLDER_PREFIX || 'tickets/';
    this.presignedUrlExpiry = parseInt(process.env.PRESIGNED_URL_EXPIRY || 3600);
  }

  /**
   * Upload file to S3
   * @param {Buffer} fileBuffer - File content
   * @param {string} fileName - Original filename
   * @param {string} mimeType - MIME type
   * @param {string} ticketId - Ticket ID for organization
   * @returns {Promise<{s3Key: string, url: string, fileName: string, size: number}>}
   */
  async uploadFile(fileBuffer, fileName, mimeType, ticketId) {
    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.') || fileName.length);
      const ext = fileName.substring(fileName.lastIndexOf('.'));
      const uniqueFileName = `${nameWithoutExt}-${timestamp}-${random}${ext}`;

      // Create S3 key with folder structure
      const s3Key = `${this.folderPrefix}${ticketId}/${uniqueFileName}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256', // Enable encryption
        Metadata: {
          originalFileName: fileName,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);
      logger.info(`File uploaded to S3: ${s3Key}`);

      // Generate public URL (or use presigned URL)
      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;

      return {
        s3Key,
        url: publicUrl,
        fileName: uniqueFileName,
        originalName: fileName,
        size: fileBuffer.length,
        mimeType,
      };
    } catch (error) {
      logger.error(`S3 upload error: ${error.message}`);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<boolean>}
   */
  async deleteFile(s3Key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await s3Client.send(command);
      logger.info(`File deleted from S3: ${s3Key}`);
      return true;
    } catch (error) {
      logger.error(`S3 delete error: ${error.message}`);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for secure file access
   * @param {string} s3Key - S3 object key
   * @param {number} expirySeconds - URL expiry in seconds (default: 1 hour)
   * @returns {Promise<string>}
   */
  async generatePresignedUrl(s3Key, expirySeconds = this.presignedUrlExpiry) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: expirySeconds,
      });

      logger.info(`Presigned URL generated for: ${s3Key}`);
      return presignedUrl;
    } catch (error) {
      logger.error(`Presigned URL generation error: ${error.message}`);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Get file URL (presigned for private buckets)
   * @param {string} s3Key - S3 object key
   * @param {boolean} usePresigned - Use presigned URL for private access
   * @returns {Promise<string>}
   */
  async getFileUrl(s3Key, usePresigned = true) {
    try {
      if (usePresigned || process.env.S3_ACL === 'private') {
        return await this.generatePresignedUrl(s3Key);
      }
      // Public URL for public buckets
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
    } catch (error) {
      logger.error(`Get file URL error: ${error.message}`);
      throw new Error(`Failed to get file URL: ${error.message}`);
    }
  }

  /**
   * Check if file exists in S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<boolean>}
   */
  async fileExists(s3Key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      logger.error(`File exists check error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new S3Service();
