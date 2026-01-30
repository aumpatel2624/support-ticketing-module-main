require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const setupCleanDB = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected...');

        // 1. Clear existing data
        console.log('Clearing all existing data...');
        await Promise.all([
            User.deleteMany({}),
            Department.deleteMany({}),
            Category.deleteMany({}),
            Ticket.deleteMany({}),
            Notification.deleteMany({}),
            AuditLog.deleteMany({})
        ]);
        console.log('Cleanup complete.');

        // 2. Create Single SuperAdmin
        const adminData = {
            name: 'System Administrator',
            email: 'admin@system.com',
            password: 'AdminPassword123!',
            role: 'SuperAdmin',
            employeeId: 'SA-001',
            permissions: {
                canAddMembers: true,
                canAssignTickets: true,
                canManageCategories: true,
                accessLevel: 'full'
            }
        };

        const superAdmin = await User.create(adminData);

        console.log('\n=========================================');
        console.log('  CLEAN SETUP COMPLETED SUCCESSFULLY');
        console.log('=========================================');
        console.log(`  Role: ${superAdmin.role}`);
        console.log(`  Email: ${superAdmin.email}`);
        console.log(`  Password: AdminPassword123!`);
        console.log('=========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('Error during clean setup:', error.message);
        process.exit(1);
    }
};

setupCleanDB();
