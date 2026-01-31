#!/usr/bin/env node

/**
 * Migration Script: Update attachments with correct S3 URLs
 *
 * This script:
 * 1. Finds all tickets with attachments that have old local file paths
 * 2. Reconstructs S3 keys and URLs based on the correct S3_FOLDER_PREFIX
 * 3. Updates all attachment records with proper s3Key and s3Url fields
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const logger = require('../utils/logger');

const s3BucketName = process.env.S3_BUCKET_NAME;
const s3FolderPrefix = process.env.S3_FOLDER_PREFIX || 'prod/tickets/';

async function migrateAttachments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Find all tickets with attachments
    const tickets = await Ticket.find({ 'attachments.0': { $exists: true } });
    logger.info(`Found ${tickets.length} tickets with attachments`);

    let totalAttachments = 0;
    let updatedAttachments = 0;
    let skipAttachments = 0;

    for (const ticket of tickets) {
      const ticketId = ticket._id.toString();
      let ticketUpdated = false;

      for (const attachment of ticket.attachments) {
        totalAttachments++;

        // Skip if already has s3Url
        if (attachment.s3Url && attachment.s3Key) {
          logger.info(
            `[${ticketId}] Attachment "${attachment.filename}" already has S3 URL - skipping`
          );
          skipAttachments++;
          continue;
        }

        // Skip if has no filename
        if (!attachment.filename) {
          logger.warn(`[${ticketId}] Attachment has no filename - skipping`);
          skipAttachments++;
          continue;
        }

        // Construct S3 key
        const s3Key = `${s3FolderPrefix}${ticketId}/${attachment.filename}`;
        const s3Url = `https://${s3BucketName}.s3.amazonaws.com/${s3Key}`;

        // Update attachment
        attachment.s3Key = s3Key;
        attachment.s3Url = s3Url;

        logger.info(
          `[${ticketId}] Updated attachment "${attachment.filename}"`
        );
        logger.info(`  → S3 Key: ${s3Key}`);
        logger.info(`  → S3 URL: ${s3Url}`);

        ticketUpdated = true;
        updatedAttachments++;
      }

      // Save ticket if any attachments were updated
      if (ticketUpdated) {
        await ticket.save();
        logger.info(`[${ticketId}] Ticket saved`);
      }
    }

    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('MIGRATION SUMMARY');
    logger.info('='.repeat(60));
    logger.info(`Total attachments processed: ${totalAttachments}`);
    logger.info(`Updated attachments: ${updatedAttachments}`);
    logger.info(`Skipped attachments: ${skipAttachments}`);
    logger.info(`Tickets affected: ${tickets.length}`);
    logger.info(`S3 Bucket: ${s3BucketName}`);
    logger.info(`S3 Folder Prefix: ${s3FolderPrefix}`);
    logger.info('='.repeat(60));

    logger.info('✓ Migration completed successfully!');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run migration
migrateAttachments();
