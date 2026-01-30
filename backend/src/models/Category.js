const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - departmentId
 *       properties:
 *         name:
 *           type: string
 *           description: Category name
 *         description:
 *           type: string
 *           description: Category description
 *         departmentId:
 *           type: string
 *           description: Department ID reference
 *         defaultPriority:
 *           type: string
 *           enum: [Low, Medium, High, Urgent]
 *           description: Default priority for tickets in this category
 *         defaultSLA:
 *           type: number
 *           description: Default SLA in hours
 *         isActive:
 *           type: boolean
 *           description: Category status
 */

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required'],
        index: true
    },
    defaultPriority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    defaultSLA: {
        type: Number, // SLA in hours
        default: 48,
        min: [1, 'SLA must be at least 1 hour'],
        max: [720, 'SLA cannot exceed 720 hours (30 days)']
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

// Compound index for unique category name per department
categorySchema.index({ name: 1, departmentId: 1 }, { unique: true });

// Virtual for ticket count
categorySchema.virtual('ticketCount', {
    ref: 'Ticket',
    localField: '_id',
    foreignField: 'categoryId',
    count: true
});

categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema);
