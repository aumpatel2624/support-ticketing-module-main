# S3 Attachment URL Migration Guide

## Problem

Image attachments in production were pointing to local file paths instead of AWS S3 URLs:
- **Current behavior**: `https://support-ticketing-module-main.onrender.com/api/uploads/tickets/photo-1769833252583-371754818.jpg`
- **Correct behavior**: `https://{S3_BUCKET_NAME}.s3.amazonaws.com/prod/tickets/{ticketId}/{filename}`

The images exist in AWS S3 under the correct `prod/tickets/` prefix, but the database records didn't have the S3 URL fields populated.

## Root Cause

Existing attachments in the database have:
- ✓ `filename` - The stored file name
- ✓ `originalName` - User's original file name
- ✗ `s3Key` - Missing (should be `prod/tickets/{ticketId}/{filename}`)
- ✗ `s3Url` - Missing (should be `https://{bucket}.s3.amazonaws.com/prod/tickets/{ticketId}/{filename}`)
- ✗ `path` - Old local file path (ignored by frontend when s3Url is present)

## Solution

A migration script has been created to update all existing attachments with proper S3 metadata.

### Before Running the Migration

Verify your environment variables are set correctly in `.env`:

```bash
# Required for S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-bucket-name
S3_FOLDER_PREFIX=prod/tickets/

# MongoDB
MONGODB_URI=your_mongodb_connection_string
```

### Running the Migration

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Run the migration script**:
   ```bash
   npm run migrate:s3-urls
   ```

   Or manually:
   ```bash
   node src/scripts/migrate-attachments-to-s3-urls.js
   ```

3. **Monitor the output**:
   - Script connects to MongoDB
   - Finds all tickets with attachments
   - For each attachment:
     - Constructs S3 key: `prod/tickets/{ticketId}/{filename}`
     - Constructs S3 URL: `https://{bucket}.s3.amazonaws.com/prod/tickets/{ticketId}/{filename}`
     - Updates the database record
   - Displays a summary with:
     - Total attachments processed
     - Successfully updated attachments
     - Skipped attachments (already migrated)
     - Affected tickets

### Example Output

```
========================================================
MIGRATION SUMMARY
========================================================
Total attachments processed: 42
Updated attachments: 38
Skipped attachments: 4
Tickets affected: 25
S3 Bucket: my-bucket-name
S3 Folder Prefix: prod/tickets/
========================================================
✓ Migration completed successfully!
```

## How It Works

### Migration Script Flow

1. **Connect to MongoDB**
   - Establishes connection using `MONGODB_URI`

2. **Find all tickets with attachments**
   - Queries for tickets where `attachments` array is not empty

3. **Process each attachment**
   - Skips attachments that already have `s3Url` (idempotent)
   - For each attachment that needs updating:
     - Constructs S3 key: `${S3_FOLDER_PREFIX}${ticketId}/${filename}`
     - Constructs S3 URL: `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`
     - Updates the attachment object with `s3Key` and `s3Url`

4. **Save updated tickets**
   - Saves each ticket once after all its attachments are processed

### Frontend Integration

The frontend (`AttachmentList.jsx`) already has the correct logic to use S3 URLs:

```javascript
const getAttachmentUrl = (attachment) => {
  // Priority order:
  if (attachment.s3Url) {
    return attachment.s3Url;  // ✓ Uses S3 URL (new system)
  }
  if (attachment.path) {
    return `/api/${attachment.path}`;  // Falls back to local path (legacy)
  }
  if (attachment.url) {
    return attachment.url;  // Generic fallback
  }
  return '#';
};
```

**After migration**: All attachments will use `s3Url` directly, loading images from S3 buckets without going through the backend.

### Data Model Changes

The `Attachment` schema in `backend/src/models/Ticket.js` supports both old and new storage methods:

```javascript
attachments: [{
  filename: String,              // File name (e.g., "image-1234567890-abc123.jpg")
  originalName: String,          // Original user-provided name
  mimetype: String,              // MIME type (e.g., "image/jpeg")
  size: Number,                  // File size in bytes
  path: String,                  // Legacy: local file path
  s3Key: String,                 // New: S3 object key
  s3Url: String,                 // New: Full S3 URL
  uploadedBy: ObjectId,          // User who uploaded
  uploadedAt: Date               // Upload timestamp
}]
```

## Verification

After running the migration, verify the fix:

1. **Check database**:
   ```bash
   # In MongoDB shell
   db.tickets.findOne({ attachments: { $exists: true } })

   # Should show:
   {
     "_id": ObjectId(...),
     "attachments": [{
       "filename": "image-1234567890-abc123.jpg",
       "originalName": "image.jpg",
       "s3Key": "prod/tickets/507f1f77bcf86cd799439011/image-1234567890-abc123.jpg",
       "s3Url": "https://my-bucket.s3.amazonaws.com/prod/tickets/507f1f77bcf86cd799439011/image-1234567890-abc123.jpg",
       ...
     }]
   }
   ```

2. **Test in frontend**:
   - Open a ticket with attachments
   - Images should load directly from S3
   - Network inspector should show requests to `s3.amazonaws.com`
   - Images appear in the attachment list and preview modals

3. **Check new uploads**:
   - Upload a new file to a ticket
   - Verify it has both `s3Key` and `s3Url` in the database
   - Verify it loads correctly in the frontend

## Rollback (if needed)

The migration is **idempotent** - running it multiple times is safe:
- Attachments with existing `s3Url` are skipped
- You can run the migration anytime without causing duplicates or conflicts

If something goes wrong:
1. Stop the application
2. Check MongoDB for data integrity
3. Run the migration again (it will only update missing s3Url fields)

## Future Uploads

All **new file uploads** after this deployment will automatically include `s3Url` because the upload controller in `backend/src/controllers/ticket.controller.js` sets both `s3Key` and `s3Url` fields.

## Performance Considerations

- Migration processes all tickets at once
- For large deployments (1000s of attachments), this may take a few minutes
- No downtime required - can be run with the application running
- Consider running during low-traffic periods
- Monitor MongoDB logs for performance impact

## Troubleshooting

### Script fails with "MongoDB connection error"
- Verify `MONGODB_URI` is correct
- Check MongoDB is running and accessible
- Ensure credentials in `.env` are valid

### Script shows "0 attachments updated"
- All attachments may already be migrated
- Check database directly to verify `s3Url` fields exist

### Images still not loading after migration
- Clear browser cache
- Verify S3 bucket name and region in `.env`
- Check S3 bucket policy allows public reads (or uses presigned URLs)
- Verify images actually exist in S3 at `s3://{bucket}/prod/tickets/{ticketId}/{filename}`

### S3 connection errors
- Verify AWS credentials in `.env`
- Ensure IAM user has S3 access permissions
- Check AWS_REGION matches S3 bucket region
