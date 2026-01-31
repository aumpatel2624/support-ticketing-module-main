const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError, ValidationError, NotFoundError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new AuthenticationError('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated. Please contact administrator');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AuthenticationError('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: userResponse,
            accessToken,
            refreshToken
        }
    });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // Optionally implement token blacklist here

    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        if (decoded.type !== 'refresh') {
            throw new AuthenticationError('Invalid token type');
        }

        // Get user
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (!user.isActive) {
            throw new AuthenticationError('Account is deactivated');
        }

        // Generate new access token
        const newAccessToken = user.generateAccessToken();

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new AuthenticationError('Invalid refresh token');
        }
        if (error.name === 'TokenExpiredError') {
            throw new AuthenticationError('Refresh token expired. Please login again');
        }
        throw error;
    }
});

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        // Don't reveal if user exists or not
        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent'
        });
        return;
    }

    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    res.status(200).json({
        success: true,
        message: 'Password reset link sent to email',
        // REMOVE IN PRODUCTION:
        ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });
});

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
        throw new ValidationError('Invalid or expired reset token');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successful. You can now login with your new password'
    });
});

/**
 * @desc    Change password (authenticated user)
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password changed successfully'
    });
});

module.exports = {
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    changePassword
};
