require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// Data
const DEPARTMENTS = [
    { name: 'IT Support', description: 'Technical support and hardware issues', icon: 'monitor', color: '#3B82F6' },
    { name: 'HR', description: 'Human resources and payroll', icon: 'users', color: '#EC4899' },
    { name: 'Sales', description: 'Sales operations and CRM', icon: 'trending-up', color: '#10B981' },
    { name: 'Operations', description: 'General operations and logistics', icon: 'settings', color: '#6366F1' }
];

const CATEGORIES = [
    { name: 'Hardware', departmentName: 'IT Support', priority: 'High' },
    { name: 'Software', departmentName: 'IT Support', priority: 'Medium' },
    { name: 'Network', departmentName: 'IT Support', priority: 'High' },
    { name: 'Access', departmentName: 'IT Support', priority: 'Urgent' },
    { name: 'Payroll', departmentName: 'HR', priority: 'High' },
    { name: 'Leave', departmentName: 'HR', priority: 'Low' }
];

const USERS = [
    {
        name: 'Sarah Agent',
        email: 'agent@apidel.com',
        role: 'TeamMember',
        departmentName: 'IT Support',
        employeeId: 'EMP001'
    },
    {
        name: 'John User',
        email: 'user@apidel.com',
        role: 'NormalUser',
        departmentName: 'Sales',
        employeeId: 'EMP002'
    },
    {
        name: 'Mike Admin',
        email: 'admin@apidel.com',
        role: 'Admin',
        departmentName: 'IT Support',
        permissions: { canAddMembers: true, canAssignTickets: true, canManageCategories: true, accessLevel: 'full' },
        employeeId: 'EMP003'
    },
    {
        name: 'David Head',
        email: 'head@apidel.com',
        role: 'Admin', // Mapped 'Head' to 'Admin'
        departmentName: 'IT Support',
        permissions: { canAddMembers: true, canAssignTickets: true, canManageCategories: true, accessLevel: 'full' },
        employeeId: 'EMP004'
    },
    {
        name: 'Alice Super',
        email: 'super@apidel.com',
        role: 'SuperAdmin',
        departmentName: 'Operations',
        permissions: { canAddMembers: true, canAssignTickets: true, canManageCategories: true, accessLevel: 'full' },
        employeeId: 'EMP005'
    }
];

const seedDB = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected...');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Department.deleteMany({}),
            Category.deleteMany({}),
            Ticket.deleteMany({}),
            Notification.deleteMany({}),
            AuditLog.deleteMany({})
        ]);
        console.log('Data cleared...');

        // 0. Create System Admin (Alice Super) first to satisfy 'createdBy' requirements
        const superAdminData = USERS.find(u => u.role === 'SuperAdmin');
        const remainingUsers = USERS.filter(u => u.role !== 'SuperAdmin');

        const superAdmin = await User.create({
            ...superAdminData,
            password: 'password123',
            department: null // Will update later
        });
        console.log(`System Admin created: ${superAdmin.name}`);

        // 1. Create Departments
        const deptMap = {};
        for (const dept of DEPARTMENTS) {
            const newDept = await Department.create({
                ...dept,
                createdBy: superAdmin._id
            });
            deptMap[dept.name] = newDept;
            console.log(`Department created: ${dept.name}`);
        }

        // Update SuperAdmin department
        if (deptMap[superAdminData.departmentName]) {
            superAdmin.department = deptMap[superAdminData.departmentName]._id;
            await superAdmin.save();
            console.log(`Updated SuperAdmin department to ${superAdminData.departmentName}`);
        }

        // 2. Create Remaining Users
        const userMap = {};
        userMap[superAdmin.email] = superAdmin; // Add super admin to map

        for (const user of remainingUsers) {
            const deptId = deptMap[user.departmentName]._id;
            const newUser = await User.create({
                ...user,
                password: 'password123', // Default password
                department: deptId
            });
            // Store in map by email for easy lookup
            userMap[user.email] = newUser;
            console.log(`User created: ${user.name} (${user.role})`);
        }

        // Assign Head of Department (David Head for IT Support as example)
        const itDept = deptMap['IT Support'];
        const headUser = userMap['head@apidel.com'];
        if (itDept && headUser) {
            itDept.headUserId = headUser._id;
            await itDept.save();
            console.log('Assigned David Head as IT Support Head');
        }

        // 3. Create Categories
        const catMap = {};
        for (const cat of CATEGORIES) {
            const dept = deptMap[cat.departmentName];
            const newCat = await Category.create({
                name: cat.name,
                departmentId: dept._id,
                defaultPriority: cat.priority,
                description: `${cat.name} issues for ${cat.departmentName}`,
                createdBy: superAdmin._id
            });
            catMap[cat.name] = newCat;
            console.log(`Category created: ${cat.name}`);
        }
    } catch (err) {
        //log for error
        console.error(err);
    }
}

seedDB();
