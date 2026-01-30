require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const SUPER_ADMIN = {
    name: 'Super Admin',
    email: 'super@apidel.com',
    role: 'SuperAdmin',
    employeeId: 'SA001',
    password: 'password123',
    department: null,
    shift: 'US',
    permissions: {
        canAddMembers: true,
        canAssignTickets: true,
        canManageCategories: true,
        accessLevel: 'full'
    }
};

const seedSuperAdmin = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected...');

        // Clear existing data
        console.log('Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Department.deleteMany({}),
            Category.deleteMany({}),
            Ticket.deleteMany({}),
            Notification.deleteMany({}),
            AuditLog.deleteMany({})
        ]);
        console.log('Data cleared (Users, Departments, Categories, Tickets, Notifications, AuditLogs).');

        // Create Super Admin
        console.log('Creating Super Admin...');
        const user = await User.create({
            ...SUPER_ADMIN
        });

        console.log('-------------------------------------------');
        console.log('Super Admin created successfully!');
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Password: ${SUPER_ADMIN.password}`);
        console.log(`Role: ${user.role}`);
        console.log(`Employee ID: ${user.employeeId}`);
        console.log('-------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Seeding Error:', error.message);
        if (error.errors) {
            console.error('Validation Errors:', error.errors);
        }
        process.exit(1);
    }
};

seedSuperAdmin();
