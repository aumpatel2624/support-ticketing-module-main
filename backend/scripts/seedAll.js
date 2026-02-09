const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Category = require('../src/models/Category');

const seedData = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Clear default database
        await mongoose.connection.dropDatabase();
        console.log('Dropped entire database');

        // 2. Create Users
        console.log('Seeding Users...');

        // Super Admin
        const superAdmin = await User.create({
            name: 'Super Admin',
            email: 'superadmin@test.com',
            password: '123456', // will be hashed by pre-save
            role: 'SuperAdmin',
            employeeId: 'SA001',
            permissions: {
                canAddMembers: true,
                canAssignTickets: true,
                canManageCategories: true,
                accessLevel: 'full'
            }
        });
        console.log('Created Super Admin');

        // Department Heads
        const itHead = await User.create({
            name: 'IT Head',
            email: 'it.head@test.com',
            password: '123456',
            role: 'Admin',
            employeeId: 'IT001',
            permissions: { canAddMembers: true, canAssignTickets: true, accessLevel: 'edit' }
        });

        const hrHead = await User.create({
            name: 'HR Head',
            email: 'hr.head@test.com',
            password: '123456',
            role: 'Admin',
            employeeId: 'HR001',
            permissions: { canAddMembers: true, canAssignTickets: true, accessLevel: 'edit' }
        });

        const fmHead = await User.create({
            name: 'FM Head',
            email: 'fm.head@test.com',
            password: '123456',
            role: 'Admin',
            employeeId: 'FM001',
            permissions: { canAddMembers: true, canAssignTickets: true, accessLevel: 'edit' }
        });
        console.log('Created Department Heads');

        // Team Members
        const itMember = await User.create({
            name: 'IT Member',
            email: 'it.member@test.com',
            password: '123456',
            role: 'TeamMember',
            employeeId: 'IT002',
            permissions: { canAddMembers: false, canAssignTickets: true, accessLevel: 'edit' }
        });

        const hrMember = await User.create({
            name: 'HR Member',
            email: 'hr.member@test.com',
            password: '123456',
            role: 'TeamMember',
            employeeId: 'HR002',
            permissions: { canAddMembers: false, canAssignTickets: true, accessLevel: 'edit' }
        });
        console.log('Created Team Members');

        // Normal User
        const normalUser = await User.create({
            name: 'Normal User',
            email: 'user@test.com',
            password: '123456',
            role: 'NormalUser',
            employeeId: 'US001',
            permissions: { accessLevel: 'read' }
        });
        console.log('Created Normal User');


        // 3. Create Departments
        console.log('Seeding Departments...');

        const itDept = await Department.create({
            name: 'IT',
            code: 'IT-DEPT',
            description: 'Information Technology Department',
            headUserId: itHead._id,
            createdBy: superAdmin._id,
            color: '#3B82F6',
            icon: 'Monitor'
        });

        const hrDept = await Department.create({
            name: 'HR',
            code: 'HR-DEPT',
            description: 'Human Resources Department',
            headUserId: hrHead._id,
            createdBy: superAdmin._id,
            color: '#EC4899',
            icon: 'Users'
        });

        const fmDept = await Department.create({
            name: 'Facility Management',
            code: 'FM-DEPT',
            description: 'Facility Management Department',
            headUserId: fmHead._id,
            createdBy: superAdmin._id,
            color: '#F59E0B',
            icon: 'Building'
        });
        console.log('Created Departments: IT, HR, Facility Management');

        // Update Users with Department IDs
        await User.findByIdAndUpdate(itHead._id, { department: itDept._id });
        await User.findByIdAndUpdate(itMember._id, { department: itDept._id });
        await User.findByIdAndUpdate(hrHead._id, { department: hrDept._id });
        await User.findByIdAndUpdate(hrMember._id, { department: hrDept._id });
        await User.findByIdAndUpdate(fmHead._id, { department: fmDept._id });


        // 4. Create Categories
        console.log('Seeding Categories...');

        // IT Categories
        await Category.create([
            { name: 'Hardware Issue', departmentId: itDept._id, defaultPriority: 'High', createdBy: superAdmin._id },
            { name: 'Software Issue', departmentId: itDept._id, defaultPriority: 'Medium', createdBy: superAdmin._id },
            { name: 'Network Issue', departmentId: itDept._id, defaultPriority: 'Urgent', createdBy: superAdmin._id },
            { name: 'Access Request', departmentId: itDept._id, defaultPriority: 'Low', createdBy: superAdmin._id }
        ]);

        // HR Categories
        await Category.create([
            { name: 'Payroll Inquiry', departmentId: hrDept._id, defaultPriority: 'High', createdBy: superAdmin._id },
            { name: 'Leave Request', departmentId: hrDept._id, defaultPriority: 'Medium', createdBy: superAdmin._id },
            { name: 'Policy Question', departmentId: hrDept._id, defaultPriority: 'Low', createdBy: superAdmin._id }
        ]);

        // FM Categories
        await Category.create([
            { name: 'Maintenance Request', departmentId: fmDept._id, defaultPriority: 'Medium', createdBy: superAdmin._id },
            { name: 'Cleaning Request', departmentId: fmDept._id, defaultPriority: 'Low', createdBy: superAdmin._id },
            { name: 'Security Issue', departmentId: fmDept._id, defaultPriority: 'Urgent', createdBy: superAdmin._id }
        ]);
        console.log('Created Categories for all departments');

        console.log('Seeding Complete!');
        process.exit();

    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();

