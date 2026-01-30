/**
 * Migration Script: Migrate local file uploads to AWS S3
 *
 * Usage: node backend/scripts/migrate-uploads-to-s3.js
 *
 * This script:
 * 1. Finds all tickets with attachments
 * 2. Uploads local files to S3
 * 3. Updates MongoDB with S3 metadata
 * 4. Creates backup of original files
 * 5. Generates migration report
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Ticket = require('../src/models/Ticket');
const s3Service = require('../src/services/s3.service');
const logger = require('../src/utils/logger');

// Migration statistics
const stats = {
  totalTickets: 0,
  totalAttachments: 0,
  successfulMigrations: 0,
  failedMigrations: 0,
  skipped: 0,
  errors: []
};

/**
 * Main migration function
 */
async function migrateUploadsToS3() {
  try {
    console.log('🚀 Starting migration of local files to AWS S3...\n');

    // Verify S3 configuration
    if (!process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) {
      throw new Error('AWS_REGION and S3_BUCKET_NAME environment variables are required');
    }

    console.log(`📦 AWS S3 Configuration:`);
    console.log(`   Bucket: ${process.env.S3_BUCKET_NAME}`);
    console.log(`   Region: ${process.env.AWS_REGION}`);
    console.log(`   Prefix: ${process.env.S3_FOLDER_PREFIX || 'tickets/'}\n`);

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketing-system');
    console.log('✅ MongoDB connected\n');

    // Find all tickets with attachments
    console.log('📋 Finding tickets with attachments...');
    const ticketsWithAttachments = await Ticket.find({
      'attachments.0': { $exists: true }
    });

    stats.totalTickets = ticketsWithAttachments.length;
    console.log(`✅ Found ${stats.totalTickets} tickets with attachments\n`);

    if (ticketsWithAttachments.length === 0) {
      console.log('ℹ️  No attachments to migrate.');
      process.exit(0);
    }

    // Create backup directory
    const backupDir = path.join(__dirname, '../backup-uploads', new Date().toISOString().split('T')[0]);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${backupDir}\n`);
    }

    // Migrate each ticket's attachments
    for (const ticket of ticketsWithAttachments) {
      console.log(`\n📌 Processing Ticket: ${ticket.ticketId}`);
      console.log(`   Attachments: ${ticket.attachments.length}`);

      for (let i = 0; i < ticket.attachments.length; i++) {
        const attachment = ticket.attachments[i];
        stats.totalAttachments++;

        // Skip if already migrated to S3
        if (attachment.s3Key) {
          console.log(`   ⏭️  [${i + 1}/${ticket.attachments.length}] ${attachment.originalName} (already in S3, skipping)`);
          stats.skipped++;
          continue;
        }

        // Verify local file exists
        if (!attachment.path) {
          console.log(`   ⚠️  [${i + 1}/${ticket.attachments.length}] ${attachment.originalName} (no path, skipping)`);
          stats.skipped++;
          continue;
        }

        const localFilePath = path.resolve(attachment.path);
        if (!fs.existsSync(localFilePath)) {
          console.log(`   ❌ [${i + 1}/${ticket.attachments.length}] ${attachment.originalName} (file not found)`);
          stats.failedMigrations++;
          stats.errors.push({
            ticket: ticket.ticketId,
            file: attachment.originalName,
            error: 'File not found at path'
          });
          continue;
        }

        try {
          // Read file from disk
          const fileBuffer = fs.readFileSync(localFilePath);

          // Upload to S3
          console.log(`   ⬆️  [${i + 1}/${ticket.attachments.length}] Uploading ${attachment.originalName}...`);
          const s3Result = await s3Service.uploadFile(
            fileBuffer,
            attachment.originalName,
            attachment.mimetype,
            ticket._id.toString()
          );

          // Create backup of original file
          const backupPath = path.join(backupDir, `${ticket.ticketId}-${attachment.filename}`);
          fs.copyFileSync(localFilePath, backupPath);

          // Update attachment record
          attachment.s3Key = s3Result.s3Key;
          attachment.s3Url = s3Result.url;
          // Keep path for backward compatibility

          console.log(`   ✅ [${i + 1}/${ticket.attachments.length}] ${attachment.originalName} migrated successfully`);
          stats.successfulMigrations++;

        } catch (error) {
          console.log(`   ❌ [${i + 1}/${ticket.attachments.length}] Failed: ${error.message}`);
          stats.failedMigrations++;
          stats.errors.push({
            ticket: ticket.ticketId,
            file: attachment.originalName,
            error: error.message
          });
        }
      }

      // Save ticket with updated attachment records
      try {
        await ticket.save();
        console.log(`   💾 Ticket ${ticket.ticketId} saved to MongoDB`);
      } catch (error) {
        console.log(`   ❌ Failed to save ticket ${ticket.ticketId}: ${error.message}`);
        stats.errors.push({
          ticket: ticket.ticketId,
          error: `Database save failed: ${error.message}`
        });
      }
    }

    // Print migration report
    printMigrationReport(backupDir);

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    logger.error(`Migration error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Print migration summary report
 */
function printMigrationReport(backupDir) {
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 MIGRATION REPORT');
  console.log('='.repeat(60));

  console.log(`\n📈 Statistics:`);
  console.log(`   Total Tickets Processed:  ${stats.totalTickets}`);
  console.log(`   Total Attachments:        ${stats.totalAttachments}`);
  console.log(`   Successful Migrations:    ${stats.successfulMigrations} ✅`);
  console.log(`   Failed Migrations:        ${stats.failedMigrations} ❌`);
  console.log(`   Skipped:                  ${stats.skipped} ⏭️`);

  const successRate = stats.totalAttachments > 0
    ? ((stats.successfulMigrations / stats.totalAttachments) * 100).toFixed(2)
    : 0;
  console.log(`   Success Rate:             ${successRate}%`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${stats.errors.length}):`);
    stats.errors.forEach(err => {
      console.log(`   • ${err.ticket || 'Unknown'}: ${err.file || ''} - ${err.error}`);
    });
  }

  console.log(`\n💾 Backup Location: ${backupDir}`);
  console.log(`   Original files backed up for safety\n`);

  console.log('📝 Next Steps:');
  console.log('   1. Verify migration in MongoDB (check attachment records)');
  console.log('   2. Verify files exist in S3 bucket');
  console.log('   3. Test file download via presigned URLs');
  console.log('   4. Once verified, delete local /uploads directory');
  console.log('   5. Update deployment to use S3 URLs\n');

  console.log('=' + '='.repeat(59));
}

// Run migration
migrateUploadsToS3();
