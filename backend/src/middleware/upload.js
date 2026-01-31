const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');
const { ValidationError } = require('../utils/ApiError');
const s3Client = require('../config/s3');

// Determine storage mode: S3 or local fallback
const useS3 = process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME;

let storage;

if (useS3) {
    // Configure S3 storage
    // Note: ACL parameter removed - bucket has ACLs disabled (modern AWS best practice)
    // Objects will use bucket policy for public access instead
    storage = multerS3({
        s3: s3Client,
        bucket: process.env.S3_BUCKET_NAME,
        key: function (req, file, cb) {
            // Generate unique filename
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 9);
            const ext = path.extname(file.originalname);
            const nameWithoutExt = path.basename(file.originalname, ext);
            const uniqueFileName = `${nameWithoutExt}-${timestamp}-${random}${ext}`;

            // Get ticketId from request params
            const ticketId = req.params.id;
            const s3Key = `${process.env.S3_FOLDER_PREFIX || 'tickets/'}${ticketId}/${uniqueFileName}`;

            cb(null, s3Key);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    });
} else {
    // Fallback to local disk storage if S3 not configured
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const ticketDir = path.join(uploadDir, 'tickets');
            if (!fs.existsSync(ticketDir)) {
                fs.mkdirSync(ticketDir, { recursive: true });
            }
            cb(null, ticketDir);
        },
        filename: function (req, file, cb) {
            // Generate unique filename: timestamp-randomstring-originalname
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const nameWithoutExt = path.basename(file.originalname, ext);
            cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
        }
    });
}

// File filter - allowed file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ValidationError('Invalid file type. Allowed: images, PDF, DOC, DOCX, XLS, XLSX, TXT'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
    },
    fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = upload.single('file');

// Middleware for multiple files upload (max 5)
const uploadMultiple = upload.array('files', 5);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            const maxSize = (parseInt(process.env.MAX_FILE_SIZE) || 5242880) / (1024 * 1024);
            return res.status(413).json({
                success: false,
                error: `File too large. Maximum size: ${maxSize}MB`
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files. Maximum: 5 files'
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    next(err);
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    handleUploadError
};
