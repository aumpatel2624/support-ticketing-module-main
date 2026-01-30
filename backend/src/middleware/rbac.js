const { AuthorizationError } = require('../utils/ApiError');

/**
 * Role-Based Access Control Middleware
 * Checks if user has required role or permission
 */

/**
 * Check if user has one of the required roles
 * @param {Array<string>} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AuthorizationError('Authentication required');
        }

        if (!roles.includes(req.user.role)) {
            throw new AuthorizationError(`Access denied. Required role: ${roles.join(' or ')}`);
        }

        next();
    };
};

/**
 * Check if user has specific permission
 * @param {string} permission - Permission key to check
 * @returns {Function} Express middleware
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AuthorizationError('Authentication required');
        }

        // SuperAdmin has all permissions
        if (req.user.role === 'SuperAdmin') {
            return next();
        }

        // Check if user has the specific permission
        if (!req.user.permissions || !req.user.permissions[permission]) {
            throw new AuthorizationError(`Access denied. Required permission: ${permission}`);
        }

        next();
    };
};

/**
 * Check if user has required access level
 * @param {string} requiredLevel - Required access level (read, edit, full)
 * @returns {Function} Express middleware
 */
const requireAccessLevel = (requiredLevel) => {
    const levels = { read: 1, edit: 2, full: 3 };

    return (req, res, next) => {
        if (!req.user) {
            throw new AuthorizationError('Authentication required');
        }

        // SuperAdmin has full access
        if (req.user.role === 'SuperAdmin') {
            return next();
        }

        const userLevel = levels[req.user.permissions?.accessLevel] || 0;
        const required = levels[requiredLevel] || 0;

        if (userLevel < required) {
            throw new AuthorizationError(`Insufficient access level. Required: ${requiredLevel}`);
        }

        next();
    };
};

/**
 * Check if user is SuperAdmin
 */
const requireSuperAdmin = requireRole('SuperAdmin');

/**
 * Check if user is Admin or higher
 */
const requireAdmin = requireRole('SuperAdmin', 'Admin');

/**
 * Check if user is TeamMember or higher
 */
const requireTeamMember = requireRole('SuperAdmin', 'Admin', 'TeamMember');

/**
 * Check if user belongs to specific department
 * @param {Function} getDepartmentId - Function to extract department ID from request
 * @returns {Function} Express middleware
 */
const requireDepartmentAccess = (getDepartmentId) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AuthorizationError('Authentication required');
        }

        // SuperAdmin has access to all departments
        if (req.user.role === 'SuperAdmin') {
            return next();
        }

        const departmentId = getDepartmentId(req);

        if (!req.user.department || req.user.department.toString() !== departmentId.toString()) {
            throw new AuthorizationError('Access denied. You do not belong to this department');
        }

        next();
    };
};

module.exports = {
    requireRole,
    requirePermission,
    requireAccessLevel,
    requireSuperAdmin,
    requireAdmin,
    requireTeamMember,
    requireDepartmentAccess
};
