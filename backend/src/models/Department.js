const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Department:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Department name
 *         description:
 *           type: string
 *           description: Department description
 *         icon:
 *           type: string
 *           description: Icon name or URL
 *         color:
 *           type: string
 *           description: Department color (hex code)
 *         headUserId:
 *           type: string
 *           description: Department head user ID
 *         isActive:
 *           type: boolean
 *           description: Department status
 */

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Department name is required'],
        unique: true,
        trim: true,
        index: true
    },
    code: {
        type: String,
        required: [true, 'Department code is required'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: 2,
        maxlength: 10
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    icon: {
        type: String,
        default: 'folder'
    },
    color: {
        type: String,
        default: '#3B82F6', // Default blue color
        match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code']
    },
    headUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Virtual for ticket count (populated when needed)
departmentSchema.virtual('ticketCount', {
    ref: 'Ticket',
    localField: '_id',
    foreignField: 'departmentId',
    count: true
});

// Ensure virtuals are included in JSON
departmentSchema.set('toJSON', { virtuals: true });
departmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Department', departmentSchema);
