const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       required:
 *         - subject
 *         - description
 *         - departmentId
 *         - categoryId
 *       properties:
 *         ticketId:
 *           type: string
 *           description: Auto-generated ticket ID (TKT-YYYY-NNNN)
 *         subject:
 *           type: string
 *           description: Ticket subject
 *         description:
 *           type: string
 *           description: Detailed description
 *         departmentId:
 *           type: string
 *           description: Department reference
 *         categoryId:
 *           type: string
 *           description: Category reference
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High, Urgent]
 *         status:
 *           type: string
 *           enum: [New, Assigned, InProgress, Pending, Completed, Closed, Escalated]
 *         createdBy:
 *           type: string
 *           description: User who created the ticket
 *         assignedTo:
 *           type: string
 *           description: User assigned to the ticket
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         feedback:
 *           type: string
 */

// Comment subdocument schema
const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: [true, 'Comment text is required'],
        trim: true
    },
    isInternal: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Attachment subdocument schema
const attachmentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        // No longer required - for backward compatibility with old attachments
    },
    // S3 fields (new)
    s3Key: {
        type: String,
        // Required for new uploads, optional for legacy files
    },
    s3Url: {
        type: String,
        // Public or presigned URL to S3 object
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// Status history subdocument schema
const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['New', 'Assigned', 'InProgress', 'Pending', 'Completed', 'Closed', 'Escalated'],
        required: true
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comment: {
        type: String,
        trim: true
    },
    changedAt: {
        type: Date,
        default: Date.now
    }
});

// Main Ticket schema
const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true,
        index: true
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required'],
        index: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required'],
        index: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium',
        index: true
    },
    status: {
        type: String,
        enum: ['New', 'Assigned', 'InProgress', 'Pending', 'Completed', 'Closed', 'Escalated'],
        default: 'New',
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    comments: [commentSchema],
    attachments: [attachmentSchema],
    statusHistory: [statusHistorySchema],
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    feedback: {
        type: String,
        trim: true,
        default: null
    },
    slaDeadline: {
        type: Date,
        default: null
    },
    slaBreach: {
        type: Boolean,
        default: false
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    closedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for better query performance
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ updatedAt: -1 });
ticketSchema.index({ status: 1, priority: -1 });
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

/**
 * Generate unique ticket ID in format TKT-YYYY-NNNN
 */
ticketSchema.pre('save', async function () {
    if (!this.ticketId) {
        try {
            const User = mongoose.model('User');
            const Department = mongoose.model('Department');

            const [user, dept] = await Promise.all([
                User.findById(this.createdBy),
                Department.findById(this.departmentId)
            ]);

            let shiftCode = 'UK'; // Default
            let deptCode = 'XX';
            let empId = 'UNKNOWN';

            if (user) {
                // Shift is already US or UK
                shiftCode = user.shift || 'UK';
                empId = user.employeeId || 'NOID';
            }

            if (dept) {
                // Use the department code if available, else fallback to name
                deptCode = dept.code ? dept.code.toUpperCase() : (dept.name ? dept.name.substring(0, 2).toUpperCase() : 'XX');
            }

            // Format: Shift(2)-Dept(Code)-EmployeeID
            const prefix = `${shiftCode}-${deptCode}-${empId}`;

            // Find count of tickets with this prefix to ensure uniqueness
            // We'll append a sequence number: SS-DD-EMPID-001
            const regex = new RegExp(`^${prefix}-\\d+$`);

            const lastTicket = await this.constructor.findOne({ ticketId: regex })
                .sort({ ticketId: -1 })
                .select('ticketId');

            let nextNum = 1;
            if (lastTicket) {
                const parts = lastTicket.ticketId.split('-');
                const lastNum = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(lastNum)) {
                    nextNum = lastNum + 1;
                }
            }

            this.ticketId = `${prefix}-${String(nextNum).padStart(3, '0')}`;
        } catch (error) {
            console.error('Error generating ticket ID:', error);
            // Fallback
            const year = new Date().getFullYear();
            const num = Math.floor(Math.random() * 10000);
            this.ticketId = `ERR-${year}-${num}`;
        }
    }
});

/**
 * Calculate SLA deadline based on category
 */
ticketSchema.methods.calculateSLA = async function () {
    const Category = mongoose.model('Category');
    const category = await Category.findById(this.categoryId);

    if (category && category.defaultSLA) {
        const slaHours = category.defaultSLA;
        this.slaDeadline = new Date(this.createdAt.getTime() + (slaHours * 60 * 60 * 1000));
    }
};

/**
 * Check if SLA is breached
 */
ticketSchema.methods.checkSLABreach = function () {
    if (this.slaDeadline && !this.resolvedAt) {
        this.slaBreach = new Date() > this.slaDeadline;
    }
    return this.slaBreach;
};

/**
 * Add status change to history
 */
ticketSchema.methods.addStatusHistory = function (status, userId, comment = '') {
    this.statusHistory.push({
        status,
        changedBy: userId,
        comment,
        changedAt: new Date()
    });
};

/**
 * Validate status transition
 */
ticketSchema.methods.canTransitionTo = function (newStatus) {
    const transitions = {
        'New': ['Assigned', 'Closed'],
        'Assigned': ['InProgress', 'New', 'Closed'],
        'InProgress': ['Pending', 'Completed', 'Escalated', 'Closed'],
        'Pending': ['InProgress', 'Completed', 'Closed'],
        'Completed': ['Closed', 'InProgress'],
        'Closed': [],
        'Escalated': ['Assigned', 'InProgress', 'Closed']
    };

    return transitions[this.status]?.includes(newStatus) || false;
};

/**
 * Calculate age in days
 */
ticketSchema.virtual('age').get(function () {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

/**
 * Calculate resolution time in hours
 */
ticketSchema.virtual('resolutionTime').get(function () {
    if (this.resolvedAt) {
        const diffTime = Math.abs(new Date(this.resolvedAt) - new Date(this.createdAt));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        return diffHours;
    }
    return null;
});

// Ensure virtuals are included in JSON
ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ticket', ticketSchema);
