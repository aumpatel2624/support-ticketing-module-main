const User = require('../models/User');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPaginationParams, createPaginationResponse, applyPagination } = require('../utils/pagination');

/**
 * @desc    Get all users (with filters and pagination)
 * @route   GET /api/users
 * @access  Private (SuperAdmin)
 */
const getUsers = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { role, department, isActive, search } = req.query;

    // Build filter
    const filter = {};

    // ID Access Control
    // If user is Admin, force filter by their department
    if (req.user.role === 'Admin') {
        if (!req.user.department) {
            // If admin has no department, they shouldn't see anyone (or maybe just themselves?)
            // For safety, let's filter by a non-existent ID or their own ID
            // But simpler: just force their department ID
            // If req.user.department is null, this query { department: null } might work or return unconnected users
            filter.department = null;
        } else {
            filter.department = req.user.department;
        }
    }

    if (role) filter.role = role;
    // Allow filtering by department ONLY if not Admin (Admin is already restricted)
    if (department && req.user.role !== 'Admin') filter.department = department;

    if (isActive !== undefined) filter.isActive = isActive;

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { employeeId: { $regex: search, $options: 'i' } }
        ];
    }

    // Execute query with pagination
    const [usersRaw, total] = await Promise.all([
        User.find(filter)
            .populate('department', 'name')
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        User.countDocuments(filter)
    ]);

    // Enhance users with frontend-required fields
    const users = usersRaw.map(user => {
        const userObj = user.toJSON();
        // Add status mapping
        userObj.status = user.isActive ? 'Active' : 'Inactive';
        // Flatten department name for the table (frontend expects string or object handling)
        // If we want to keep the object but make it easy for the table:
        if (user.department) {
            userObj.departmentName = user.department.name;
            userObj.departmentId = user.department._id;
            // The frontend columns.jsx uses row.getValue('department')
            // Let's replace the department object with just its name for the table's sake
            userObj.department = user.department.name;
        }
        return userObj;
    });

    const pagination = createPaginationResponse(total, page, limit);

    res.status(200).json({
        success: true,
        data: users,
        pagination
    });
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (SuperAdmin or self)
 */
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .populate('department', 'name description')
        .select('-password');

    if (!user) {
        throw new NotFoundError('User not found');
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * @desc    Create new user
 * @route   POST /api/users
 * @access  Private (SuperAdmin)
 */
const createUser = asyncHandler(async (req, res) => {
    const { employeeId, email } = req.body;

    // Check for duplicate email or employeeId
    const existingUser = await User.findOne({
        $or: [{ email }, { employeeId }]
    });

    if (existingUser) {
        if (existingUser.email === email) {
            throw new ConflictError('Email already exists');
        }
        if (existingUser.employeeId === employeeId) {
            throw new ConflictError('Employee ID already exists');
        }
    }

    // Create user
    const user = await User.create(req.body);

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userResponse
    });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (SuperAdmin)
 */
const updateUser = asyncHandler(async (req, res) => {
    const { email, employeeId } = req.body;

    // Check if user exists
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Check for duplicate email or employeeId (excluding current user)
    if (email || employeeId) {
        const duplicateCheck = {};
        if (email) duplicateCheck.email = email;
        if (employeeId) duplicateCheck.employeeId = employeeId;

        const existingUser = await User.findOne({
            ...duplicateCheck,
            _id: { $ne: req.params.id }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new ConflictError('Email already exists');
            }
            if (existingUser.employeeId === employeeId) {
                throw new ConflictError('Employee ID already exists');
            }
        }
    }

    // Don't allow password update through this endpoint
    delete req.body.password;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
    });
});

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private (SuperAdmin)
 */
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
        throw new ValidationError('Cannot delete your own account');
    }

    // Cascading validation: Check for references before deletion
    const Department = require('../models/Department');
    const Ticket = require('../models/Ticket');

    // Collect all references
    const references = [];

    // Check 1: User is a department head
    const departments = await Department.find({
        headUserId: req.params.id,
        isActive: true
    }).select('_id name code').lean();

    if (departments.length > 0) {
        references.push({
            type: 'departments',
            count: departments.length,
            items: departments.map(d => ({
                id: d._id,
                name: d.name,
                code: d.code
            }))
        });
    }

    // Check 2: User has assigned tickets
    const tickets = await Ticket.find({
        assignedTo: req.params.id,
        status: { $nin: ['Closed'] }
    }).select('_id id title status priority').lean();

    if (tickets.length > 0) {
        references.push({
            type: 'tickets',
            count: tickets.length,
            items: tickets.map(t => ({
                id: t._id,
                ticketId: t.id,
                title: t.title,
                status: t.status,
                priority: t.priority
            }))
        });
    }

    // If any references exist, return error with details
    if (references.length > 0) {
        const error = new ValidationError(
            `Cannot deactivate user "${user.name}" because they have active references. Please resolve them first.`
        );
        error.references = references;
        throw error;
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'User deactivated successfully'
    });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('department', 'name description')
        .select('-password');

    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * @desc    Update own profile
 * @route   PUT /api/users/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
    // Only allow updating specific fields
    const allowedFields = ['name', 'email'];
    const updates = {};

    allowedFields.forEach(field => {
        if (req.body[field]) {
            updates[field] = req.body[field];
        }
    });

    // Check for duplicate email
    if (updates.email) {
        const existingUser = await User.findOne({
            email: updates.email,
            _id: { $ne: req.user._id }
        });

        if (existingUser) {
            throw new ConflictError('Email already exists');
        }
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
    });
});

/**
 * @desc    Bulk import users from Excel
 * @route   POST /api/users/bulk-import
 * @access  Private (SuperAdmin)
 */
const bulkImportUsers = asyncHandler(async (req, res) => {
    const ExcelJS = require('exceljs');

    if (!req.file) {
        throw new ValidationError('No file uploaded');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
        throw new ValidationError('Excel file has no worksheets');
    }

    const results = {
        success: [],
        errors: []
    };

    // Get header row to map columns
    const headerRow = worksheet.getRow(1);
    const headers = {};
    headerRow.eachCell((cell, colNumber) => {
        headers[cell.value?.toString().toLowerCase().trim()] = colNumber;
    });

    // Validate required headers
    const requiredHeaders = ['employeeid', 'name', 'email', 'password', 'role'];
    const missingHeaders = requiredHeaders.filter(h => !headers[h]);
    if (missingHeaders.length > 0) {
        throw new ValidationError(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Collect all emails and employeeIds from file for duplicate checking within file
    const fileEmails = new Set();
    const fileEmployeeIds = new Set();

    // Process each row (skip header)
    const rowsToProcess = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const employeeId = row.getCell(headers['employeeid'])?.value?.toString().trim();
        const name = row.getCell(headers['name'])?.value?.toString().trim();
        const email = row.getCell(headers['email'])?.value?.toString().trim()?.toLowerCase();
        const password = row.getCell(headers['password'])?.value?.toString();
        const role = row.getCell(headers['role'])?.value?.toString().trim();
        const department = headers['department'] ? row.getCell(headers['department'])?.value?.toString().trim() : null;
        const shift = headers['shift'] ? row.getCell(headers['shift'])?.value?.toString().trim() : 'UK';

        rowsToProcess.push({
            rowNumber,
            employeeId,
            name,
            email,
            password,
            role,
            department,
            shift
        });
    });

    // Get existing emails and employeeIds from DB
    const allEmails = rowsToProcess.map(r => r.email).filter(Boolean);
    const allEmployeeIds = rowsToProcess.map(r => r.employeeId).filter(Boolean);

    const existingUsers = await User.find({
        $or: [
            { email: { $in: allEmails } },
            { employeeId: { $in: allEmployeeIds } }
        ]
    }).select('email employeeId');

    const existingEmails = new Set(existingUsers.map(u => u.email));
    const existingEmployeeIds = new Set(existingUsers.map(u => u.employeeId));

    // Validate and create users
    for (const row of rowsToProcess) {
        const { rowNumber, employeeId, name, email, password, role, department, shift } = row;
        const rowErrors = [];

        // Validate required fields
        if (!employeeId) rowErrors.push('Employee ID is required');
        if (!name) rowErrors.push('Name is required');
        if (!email) rowErrors.push('Email is required');
        if (!password) rowErrors.push('Password is required');
        if (password && password.length < 6) rowErrors.push('Password must be at least 6 characters');
        if (!role) rowErrors.push('Role is required');

        // Validate role
        const validRoles = ['SuperAdmin', 'Admin', 'TeamMember', 'NormalUser'];
        if (role && !validRoles.includes(role)) {
            rowErrors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }

        // Validate shift
        const validShifts = ['US', 'UK'];
        if (shift && !validShifts.includes(shift)) {
            rowErrors.push(`Invalid shift. Must be one of: ${validShifts.join(', ')}`);
        }

        // Check for duplicates in file
        if (email && fileEmails.has(email)) {
            rowErrors.push('Duplicate email in file');
        }
        if (employeeId && fileEmployeeIds.has(employeeId)) {
            rowErrors.push('Duplicate Employee ID in file');
        }

        // Check for duplicates in DB
        if (email && existingEmails.has(email)) {
            rowErrors.push('Email already exists in system');
        }
        if (employeeId && existingEmployeeIds.has(employeeId)) {
            rowErrors.push('Employee ID already exists in system');
        }

        if (rowErrors.length > 0) {
            results.errors.push({
                row: rowNumber,
                employeeId: employeeId || 'N/A',
                email: email || 'N/A',
                errors: rowErrors
            });
            continue;
        }

        // Add to tracking sets
        fileEmails.add(email);
        fileEmployeeIds.add(employeeId);

        // Create user
        try {
            const userData = {
                employeeId,
                name,
                email,
                password,
                role,
                shift: shift || 'UK',
                isActive: true
            };

            // Handle department if provided (would need to lookup by name)
            if (department) {
                const Department = require('../models/Department');
                const dept = await Department.findOne({ name: { $regex: new RegExp(`^${department}$`, 'i') } });
                if (dept) {
                    userData.department = dept._id;
                }
            }

            const user = await User.create(userData);
            results.success.push({
                row: rowNumber,
                employeeId: user.employeeId,
                email: user.email,
                name: user.name
            });
        } catch (error) {
            results.errors.push({
                row: rowNumber,
                employeeId: employeeId || 'N/A',
                email: email || 'N/A',
                errors: [error.message]
            });
        }
    }

    res.status(200).json({
        success: true,
        message: `Import completed. ${results.success.length} users created, ${results.errors.length} failed.`,
        data: results
    });
});

/**
 * @desc    Download sample Excel template for user import
 * @route   GET /api/users/sample-template
 * @access  Private (SuperAdmin)
 */
const downloadSampleTemplate = asyncHandler(async (req, res) => {
    try {
        console.log('[UserController] downloadSampleTemplate hit');
        const ExcelJS = require('exceljs');

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Support Ticketing System';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Users');

        // Define columns
        worksheet.columns = [
            { header: 'employeeId', key: 'employeeId', width: 15 },
            { header: 'name', key: 'name', width: 25 },
            { header: 'email', key: 'email', width: 30 },
            { header: 'password', key: 'password', width: 20 },
            { header: 'role', key: 'role', width: 15 },
            { header: 'department', key: 'department', width: 20 },
            { header: 'shift', key: 'shift', width: 10 }
        ];

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add example rows
        worksheet.addRow({
            employeeId: 'EMP001',
            name: 'John Doe',
            email: 'john.doe@example.com',
            password: 'password123',
            role: 'NormalUser',
            department: 'IT',
            shift: 'UK'
        });

        worksheet.addRow({
            employeeId: 'EMP002',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            password: 'password123',
            role: 'TeamMember',
            department: 'HR',
            shift: 'US'
        });

        // Add notes/comments
        worksheet.getCell('E1').note = 'Valid roles: SuperAdmin, Admin, TeamMember, NormalUser';
        worksheet.getCell('G1').note = 'Valid shifts: US, UK';

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=user_import_template.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('[UserController] downloadSampleTemplate error:', error);
        throw error;
    }
});

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getMe,
    updateMe,
    bulkImportUsers,
    downloadSampleTemplate
};
