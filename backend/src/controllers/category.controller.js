const mongoose = require('mongoose');
const Category = require('../models/Category');
const Department = require('../models/Department');
const Ticket = require('../models/Ticket');
const { NotFoundError, ConflictError, ValidationError, AuthorizationError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Private
 */
const getCategories = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { departmentId, search } = req.query;

    const filter = {};

    // RESTRICTION: Admin can only see their department's categories
    if (req.user.role === 'Admin') {
        filter.departmentId = req.user.department;
    } else if (departmentId) {
        filter.departmentId = mongoose.Types.ObjectId.isValid(departmentId)
            ? new mongoose.Types.ObjectId(departmentId)
            : departmentId;
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const [categories, total] = await Promise.all([
        Category.find(filter)
            .populate('departmentId', 'name color')
            .populate('createdBy', 'name')
            .sort({ departmentId: 1, name: 1 })
            .skip(skip)
            .limit(limit),
        Category.countDocuments(filter)
    ]);

    const pagination = createPaginationResponse(total, page, limit);

    res.status(200).json({
        success: true,
        data: categories,
        pagination
    });
});

/**
 * @desc    Get single category
 * @route   GET /api/categories/:id
 * @access  Private
 */
const getCategoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id)
        .populate('departmentId', 'name description color')
        .populate('createdBy', 'name email');

    if (!category) {
        throw new NotFoundError('Category not found');
    }

    // RESTRICTION: Admin can only view their department's category
    if (req.user.role === 'Admin' && category.departmentId._id.toString() !== req.user.department.toString()) {
        throw new AuthorizationError('Not authorized to view this category');
    }

    res.status(200).json({
        success: true,
        data: category
    });
});

/**
 * @desc    Get categories by department
 * @route   GET /api/categories/department/:deptId
 * @access  Private
 */
const getCategoriesByDepartment = asyncHandler(async (req, res) => {
    const { deptId } = req.params;

    // RESTRICTION: Admin can only view their own department
    if (req.user.role === 'Admin' && deptId !== req.user.department.toString()) {
        throw new AuthorizationError('Not authorized to view categories for this department');
    }

    // Verify department exists
    const department = await Department.findById(deptId);
    if (!department) {
        throw new NotFoundError('Department not found');
    }

    const categories = await Category.find({
        departmentId: deptId
    }).sort({ name: 1 });

    res.status(200).json({
        success: true,
        data: categories
    });
});

/**
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Private (SuperAdmin or Admin with permission)
 */
const createCategory = asyncHandler(async (req, res) => {
    let { name, departmentId } = req.body;

    // RESTRICTION: Admin can only create for their department
    if (req.user.role === 'Admin') {
        departmentId = req.user.department; // Force department
    }

    if (!departmentId) {
        throw new ValidationError('Department is required');
    }

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
        throw new NotFoundError('Department not found');
    }

    // Check for duplicate name in same department
    const existingCategory = await Category.findOne({
        name,
        departmentId
    });

    if (existingCategory) {
        throw new ConflictError('Category with this name already exists in this department');
    }

    const category = await Category.create({
        ...req.body,
        departmentId, // ensure forced ID is used
        createdBy: req.user._id
    });

    await category.populate('departmentId', 'name color');

    res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
    });
});

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private (SuperAdmin or Admin with permission)
 */
const updateCategory = asyncHandler(async (req, res) => {
    const { name, departmentId } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
        throw new NotFoundError('Category not found');
    }

    // RESTRICTION: Admin can only update their department's category
    if (req.user.role === 'Admin') {
        if (category.departmentId.toString() !== req.user.department.toString()) {
            throw new AuthorizationError('Not authorized to update this category');
        }
        // Admin cannot move category to another department
        if (departmentId && departmentId !== req.user.department.toString()) {
            throw new AuthorizationError('Cannot move category to another department');
        }
    }

    // If changing department, verify it exists
    if (departmentId && departmentId !== category.departmentId.toString()) {
        const department = await Department.findById(departmentId);
        if (!department) {
            throw new NotFoundError('Department not found');
        }
    }

    // Check for duplicate name in department
    if (name || departmentId) {
        const checkDeptId = departmentId || category.departmentId;
        const existingCategory = await Category.findOne({
            name: name || category.name,
            departmentId: checkDeptId,
            _id: { $ne: req.params.id }
        });

        if (existingCategory) {
            throw new ConflictError('Category with this name already exists in this department');
        }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).populate('departmentId', 'name color');

    res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory
    });
});

/**
 * @desc    Delete category (permanent delete)
 * @route   DELETE /api/categories/:id
 * @access  Private (SuperAdmin or Admin with permission)
 */
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        throw new NotFoundError('Category not found');
    }

    // RESTRICTION: Admin can only delete their department's category
    if (req.user.role === 'Admin' && category.departmentId.toString() !== req.user.department.toString()) {
        throw new AuthorizationError('Not authorized to delete this category');
    }

    // Cascading validation: Check for active tickets using this category
    const tickets = await Ticket.find({
        categoryId: req.params.id,
        status: { $nin: ['Closed'] }
    }).select('_id id title status priority').lean();

    if (tickets.length > 0) {
        const error = new ValidationError(
            `Cannot delete category "${category.name}" because it has active references. Please resolve them first.`
        );
        error.references = [{
            type: 'tickets',
            count: tickets.length,
            items: tickets.map(t => ({
                id: t._id,
                ticketId: t.id,
                title: t.title,
                status: t.status,
                priority: t.priority
            }))
        }];
        throw error;
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
    });
});

module.exports = {
    getCategories,
    getCategoryById,
    getCategoriesByDepartment,
    createCategory,
    updateCategory,
    deleteCategory
};
