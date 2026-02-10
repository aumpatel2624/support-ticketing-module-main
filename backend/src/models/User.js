const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - employeeId
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         employeeId:
 *           type: string
 *           description: Unique employee identifier
 *         name:
 *           type: string
 *           description: Full name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         role:
 *           type: string
 *           enum: [SuperAdmin, Admin, TeamMember, NormalUser]
 *           description: User role
 *         department:
 *           type: string
 *           description: Department ID reference
 *         permissions:
 *           type: object
 *           properties:
 *             canAddMembers:
 *               type: boolean
 *             canAssignTickets:
 *               type: boolean
 *             canManageCategories:
 *               type: boolean
 *             accessLevel:
 *               type: string
 *               enum: [read, edit, full]
 *         isActive:
 *           type: boolean
 *           description: Account status
 *         lastLogin:
 *           type: string
 *           format: date-time
 */

const userSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ['SuperAdmin', 'Admin', 'TeamMember', 'NormalUser'],
        default: 'NormalUser',
        index: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null
    },
    permissions: {
        canAddMembers: {
            type: Boolean,
            default: false
        },
        canAssignTickets: {
            type: Boolean,
            default: false
        },
        canManageCategories: {
            type: Boolean,
            default: false
        },
        accessLevel: {
            type: String,
            enum: ['read', 'edit', 'full'],
            default: 'read'
        }
    },
    shift: {
        type: String,
        enum: ['US', 'UK'],
        default: 'UK'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpire: {
        type: Date,
        select: false
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30m' }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id,
            type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
};

userSchema.methods.generateResetToken = function () {
    const resetToken = jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    this.resetPasswordToken = resetToken;
    this.resetPasswordExpire = Date.now() + 3600000; // 1 hour

    return resetToken;
};

userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpire;
    return user;
};

module.exports = mongoose.model('User', userSchema);
