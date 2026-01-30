const Department = require('../models/Department');
const Ticket = require('../models/Ticket');
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
    const User = require('../models/User');
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
    const User = require('../models/User');
    const Category = require('../models/Category');

    // Check 1: Users assigned to this department
    const usersCount = await User.countDocuments({
        department: req.params.id,
        isActive: true
    });

    if (usersCount > 0) {
        throw new ValidationError(
            `Cannot delete department with ${usersCount} active user(s) assigned. Please reassign or deactivate them first.`
        );
    }

    // Check 2: Categories assigned to this department
    const categoriesCount = await Category.countDocuments({
        departmentId: req.params.id,
        isActive: true
    });

    if (categoriesCount > 0) {
        throw new ValidationError(
            `Cannot delete department with ${categoriesCount} active ${categoriesCount > 1 ? 'categories' : 'category'}. Please deactivate them first.`
        );
    }

    // Check 3: Active tickets in this department
    const activeTicketsCount = await Ticket.countDocuments({
        departmentId: req.params.id,
        status: { $nin: ['Closed'] }
    });

    if (activeTicketsCount > 0) {
        throw new ValidationError(
            `Cannot delete department with ${activeTicketsCount} active ticket(s). Please close or reassign them first.`
        );
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

    // TODO: Implement when Ticket model is available
    const stats = {
        totalTickets: 0,
        openTickets: 0,
        closedTickets: 0,
        avgResolutionTime: 0,
        teamMemberCount: 0
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
