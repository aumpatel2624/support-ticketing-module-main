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
    storage = multerS3({
        s3: s3Client,
        bucket: process.env.S3_BUCKET_NAME,
        key: function (req, file, cb) {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 9);
            const ext = path.extname(file.originalname);
            const nameWithoutExt = path.basename(file.originalname, ext);
            const uniqueFileName = `${nameWithoutExt}-${timestamp}-${random}${ext}`;

            const ticketId = req.params.id;

            // Determine folder based on context
            let folderPrefix = 'tickets/';
            let folderId = ticketId;

            if (req.originalUrl.includes('settings') || req.originalUrl.includes('logo')) {
                folderPrefix = 'settings/';
                folderId = 'branding';
            } else if (!ticketId) {
                folderPrefix = 'general/';
                folderId = 'uploads';
            }

            const s3Key = `${process.env.S3_FOLDER_PREFIX || ''}${folderPrefix}${folderId}/${uniqueFileName}`;

            cb(null, s3Key);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    });
} else {
    // Fallback to local disk storage
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
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const nameWithoutExt = path.basename(file.originalname, ext);
            cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
        }
    });
}

// Default allowed file types (used as fallback)
const DEFAULT_ALLOWED_TYPES = [
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

// Default max file size: 5MB
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Fetch upload settings from SystemSettings (cached for 5 minutes)
 */
let cachedSettings = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getUploadSettings = async () => {
    const now = Date.now();

    // Return cached settings if not expired
    if (cachedSettings && (now - cacheTime) < CACHE_DURATION) {
        return cachedSettings;
    }

    try {
        // Dynamic require to avoid circular dependencies
        const SystemSettings = require('../models/SystemSettings');
        const settings = await SystemSettings.findOne();

        if (settings) {
            // fileUploadMaxSize is stored in MB, convert to bytes
            const maxSizeInBytes = (settings.fileUploadMaxSize || 5) * 1024 * 1024;
            cachedSettings = {
                maxFileSize: maxSizeInBytes,
                maxFiles: settings.maxFileUploads || 5, // Cache max files
                allowedTypes: settings.allowedFileTypes?.length > 0
                    ? settings.allowedFileTypes
                    : DEFAULT_ALLOWED_TYPES
            };
            cacheTime = now;
            return cachedSettings;
        }
    } catch (err) {
        console.warn('Could not fetch SystemSettings for upload:', err.message);
    }

    // Return defaults if settings not available
    return {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || DEFAULT_MAX_FILE_SIZE,
        allowedTypes: DEFAULT_ALLOWED_TYPES
    };
};

// File filter using dynamic settings
const fileFilter = async (req, file, cb) => {
    try {
        const settings = await getUploadSettings();

        if (settings.allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new ValidationError(`Invalid file type: ${file.mimetype}. Check System Settings for allowed types.`), false);
        }
    } catch (err) {
        // Fallback to defaults on error
        if (DEFAULT_ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new ValidationError('Invalid file type. Allowed: images, PDF, DOC, DOCX, XLS, XLSX, TXT'), false);
        }
    }
};

// Configure multer with max possible size (actual validation done in middleware)
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max - actual limit checked in validateFileSize
    },
    fileFilter: fileFilter
});

// Middleware to validate file size using SystemSettings
const validateFileSize = async (req, res, next) => {
    if (!req.file && (!req.files || req.files.length === 0)) {
        return next();
    }

    try {
        const settings = await getUploadSettings();
        const files = req.file ? [req.file] : (req.files || []);

        for (const file of files) {
            if (file.size > settings.maxFileSize) {
                const maxMB = (settings.maxFileSize / (1024 * 1024)).toFixed(1);
                return res.status(413).json({
                    success: false,
                    error: `File "${file.originalname}" exceeds maximum size of ${maxMB}MB`
                });
            }
        }

        // Check file count
        if (files.length > (settings.maxFiles || 5)) {
            return res.status(400).json({
                success: false,
                error: `Too many files. Maximum allowed: ${settings.maxFiles || 5}`
            });
        }

        for (const file of files) {
            if (file.size > settings.maxFileSize) {
                const maxMB = (settings.maxFileSize / (1024 * 1024)).toFixed(1);
                return res.status(413).json({
                    success: false,
                    error: `File "${file.originalname}" exceeds maximum size of ${maxMB}MB`
                });
            }
        }

        next();
    } catch (err) {
        next(err);
    }
};

// Middleware for single file upload with size validation
const uploadSingle = [
    upload.single('file'),
    validateFileSize
];

// Middleware for multiple files upload (max 5) with size validation
const uploadMultiple = [
    upload.array('files', 20), // Allow up to 20 initially, validate actual limit in middleware
    validateFileSize
];

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                error: 'File too large. Check System Settings for maximum allowed size.'
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

// Export function to clear cache (useful for testing or when settings change)
const clearUploadSettingsCache = () => {
    cachedSettings = null;
    cacheTime = 0;
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    handleUploadError,
    getUploadSettings,
    clearUploadSettingsCache
};
