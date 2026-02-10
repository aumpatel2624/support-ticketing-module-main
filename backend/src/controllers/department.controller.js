const mongoose = require('mongoose');
const Department = require('../models/Department');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Category = require('../models/Category');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');

/**
 * @desc    Get all departments
 * @route   GET /api/departments
 * @access  Private
 */
const getDepartments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { isActive, search } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const [departmentsRaw, total] = await Promise.all([
        Department.find(filter)
            .populate('headUserId', 'name email employeeId')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Department.countDocuments(filter)
    ]);

    // Enhance departments with frontend-required fields

    const departments = await Promise.all(departmentsRaw.map(async (dept) => {
        const deptObj = dept.toObject();
        // Add status mapping
        deptObj.status = dept.isActive ? 'Active' : 'Inactive';
        // Add head user mapping (frontend expects 'head' object)
        deptObj.head = dept.headUserId;
        // Add membersCount
        deptObj.membersCount = await User.countDocuments({ department: dept._id, isActive: true });
        return deptObj;
    }));

    const pagination = createPaginationResponse(total, page, limit);

    res.status(200).json({
        success: true,
        data: departments,
        pagination
    });
});

/**
 * @desc    Get single department
 * @route   GET /api/departments/:id
 * @access  Private
 */
const getDepartmentById = asyncHandler(async (req, res) => {
    const department = await Department.findById(req.params.id)
        .populate('headUserId', 'name email employeeId role')
        .populate('createdBy', 'name email');

    if (!department) {
        throw new NotFoundError('Department not found');
    }

    res.status(200).json({
        success: true,
        data: department
    });
});

/**
 * @desc    Create department
 * @route   POST /api/departments
 * @access  Private (SuperAdmin)
 */
const createDepartment = asyncHandler(async (req, res) => {
    const { name } = req.body;

    // Check for duplicate name
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
        throw new ConflictError('Department with this name already exists');
    }

    // Create department
    const department = await Department.create({
        ...req.body,
        createdBy: req.user._id
    });

    await department.populate('headUserId', 'name email');

    res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department
    });
});

/**
 * @desc    Update department
 * @route   PUT /api/departments/:id
 * @access  Private (SuperAdmin)
 */
const updateDepartment = asyncHandler(async (req, res) => {
    const { name } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
        throw new NotFoundError('Department not found');
    }

    // Check for duplicate name (excluding current department)
    if (name) {
        const existingDepartment = await Department.findOne({
            name,
            _id: { $ne: req.params.id }
        });
        if (existingDepartment) {
            throw new ConflictError('Department with this name already exists');
        }
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).populate('headUserId', 'name email');

    res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: updatedDepartment
    });
});

/**
 * @desc    Delete department (soft delete)
 * @route   DELETE /api/departments/:id
 * @access  Private (SuperAdmin)
 */
const deleteDepartment = asyncHandler(async (req, res) => {
    const department = await Department.findById(req.params.id);
    if (!department) {
        throw new NotFoundError('Department not found');
    }

    // Cascading validation: Check for references before deletion


    // Collect all references
    const references = [];

    // Check 1: Users assigned to this department
    const users = await User.find({
        department: req.params.id,
        isActive: true
    }).select('_id name email employeeId').lean();

    if (users.length > 0) {
        references.push({
            type: 'users',
            count: users.length,
            items: users.map(u => ({
                id: u._id,
                name: u.name,
                email: u.email,
                employeeId: u.employeeId
            }))
        });
    }

    // Check 2: Categories assigned to this department
    const categories = await Category.find({
        departmentId: req.params.id,
        isActive: true
    }).select('_id name').lean();

    if (categories.length > 0) {
        references.push({
            type: 'categories',
            count: categories.length,
            items: categories.map(c => ({
                id: c._id,
                name: c.name
            }))
        });
    }

    // Check 3: Active tickets in this department
    const tickets = await Ticket.find({
        departmentId: req.params.id,
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
            `Cannot delete department "${department.name}" because it has active references. Please resolve them first.`
        );
        error.references = references;
        throw error;
    }

    department.isActive = false;
    await department.save();

    res.status(200).json({
        success: true,
        message: 'Department deactivated successfully'
    });
});

/**
 * @desc    Get department statistics
 * @route   GET /api/departments/:id/stats
 * @access  Private
 */
const getDepartmentStats = asyncHandler(async (req, res) => {
    const department = await Department.findById(req.params.id);
    if (!department) {
        throw new NotFoundError('Department not found');
    }

    const deptId = new mongoose.Types.ObjectId(req.params.id);

    // Run all queries in parallel for performance
    const [totalTickets, openTickets, closedTickets, teamMemberCount, resolutionStats] = await Promise.all([
        // 1. Total Tickets
        Ticket.countDocuments({ departmentId: deptId }),

        // 2. Open Tickets (Not Resolved or Closed)
        Ticket.countDocuments({
            departmentId: deptId,
            status: { $nin: ['Resolved', 'Closed'] }
        }),

        // 3. Closed/Resolved Tickets
        Ticket.countDocuments({
            departmentId: deptId,
            status: { $in: ['Resolved', 'Closed'] }
        }),

        // 4. Team Members
        User.countDocuments({
            department: deptId,
            isActive: true
        }),

        // 5. Average Resolution Time (Aggregation)
        Ticket.aggregate([
            {
                $match: {
                    departmentId: deptId,
                    status: { $in: ['Resolved', 'Closed'] },
                    resolvedAt: { $ne: null }
                }
            },
            {
                $group: {
                    _id: null,
                    avgTime: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } }
                }
            }
        ])
    ]);

    const avgResolutionTime = resolutionStats.length > 0
        ? Math.round(resolutionStats[0].avgTime / (1000 * 60 * 60)) // Convert to hours
        : 0;

    const stats = {
        totalTickets,
        openTickets,
        closedTickets,
        avgResolutionTime,
        teamMemberCount
    };

    res.status(200).json({
        success: true,
        data: stats
    });
});

module.exports = {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
};
