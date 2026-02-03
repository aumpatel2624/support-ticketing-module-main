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


        // 4. Create Tickets
        // Helper to get random item
        const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

        // Ticket Data Generators
        const statuses = ['New', 'Assigned', 'InProgress', 'Completed', 'Closed', 'Escalated'];
        const priorities = ['Low', 'Medium', 'High', 'Urgent'];

        const ticketsToCreate = [];

        // ACTIVE TICKETS (Exact counts from requirements)
        const activeCounts = {
            'New': 5,
            'Assigned': 8,
            'InProgress': 15
        };

        for (const [status, count] of Object.entries(activeCounts)) {
            for (let i = 0; i < count; i++) {
                ticketsToCreate.push({
                    status,
                    isHistorical: false
                });
            }
        }

        // HISTORICAL TICKETS (30 days)
        // Random 5-25 per day for last 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            const count = Math.floor(Math.random() * 21) + 5; // 5 to 25
            for (let j = 0; j < count; j++) {
                ticketsToCreate.push({
                    status: random(['Completed', 'Closed']),
                    createdAt: date,
                    isHistorical: true
                });
            }
        }

        // SPECIFIC SCENARIOS
        // 1. TKT-1001
        const tkt1001 = await Ticket.create({
            ticketId: 'TKT-1001',
            subject: 'Cannot access VPN from remote location',
            description: 'Connection times out when trying to connect to VPN.',
            status: 'InProgress',
            priority: 'High',
            categoryId: catMap['Network']._id,
            departmentId: deptMap['IT Support']._id,
            createdBy: userMap['user@apidel.com']._id,
            assignedTo: userMap['agent@apidel.com']._id,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        });
        console.log('Created Scenario Ticket: TKT-1001');

        // 2. TKT-1002
        const tkt1002 = await Ticket.create({
            ticketId: 'TKT-1002',
            subject: 'Software license expired',
            description: 'Adobe Creative Cloud license shows expired.',
            status: 'New',
            priority: 'Medium',
            categoryId: catMap['Software']._id.toString(),
            departmentId: deptMap['IT Support']._id.toString(),
            createdBy: userMap['user@apidel.com']._id.toString(),
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
        });
        console.log('Created Scenario Ticket: TKT-1002');

        // 3. TKT-1025 (Escalated/Urgent) - Note: 'Escalated' might not be a valid enum status in my schema check Ticket.js
        // Checking Ticket.js logic below or assuming standard enum. If 'Escalated' fail, use 'InProgress' + Critical
        const tkt1025 = await Ticket.create({
            ticketId: 'TKT-1025',
            subject: 'Critical Network Failure Floor 3',
            description: 'Entire floor lost internet access.',
            status: 'Escalated',
            priority: 'Urgent',
            categoryId: catMap['Network']._id.toString(),
            departmentId: deptMap['IT Support']._id.toString(),
            createdBy: userMap['head@apidel.com']._id.toString(),
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        });
        console.log('Created Scenario Ticket: TKT-1025');


        // Process generated batch
        let ticketCounter = 1050; // Start after specific scenarios

        console.log(`Generating ${ticketsToCreate.length} bulk tickets...`);

        const staffUsers = [userMap['agent@apidel.com'], userMap['admin@apidel.com'], userMap['head@apidel.com']];
        const normalUsers = [userMap['user@apidel.com']];

        for (const item of ticketsToCreate) {
            const creator = random(normalUsers);
            const assignee = item.status === 'New' ? null : random(staffUsers);
            const categoryKey = random(Object.keys(catMap));
            const category = catMap[categoryKey];
            const dept = await Department.findById(category.departmentId); // Simplified fetch

            const tkt = new Ticket({
                ticketId: `TKT-${ticketCounter++}`,
                subject: `Sample Ticket ${ticketCounter}: ${category.name} Issue`,
                description: `This is a generated ${item.isHistorical ? 'historical' : 'active'} ticket.`,
                status: item.status,
                priority: random(priorities),
                categoryId: category._id,
                departmentId: dept._id,
                createdBy: creator._id,
                assignedTo: assignee ? assignee._id : null,
                createdAt: item.createdAt || new Date(),
                // Resolved timestamps for closed tickets
                resolvedAt: ['Completed', 'Closed'].includes(item.status) ? (item.createdAt || new Date()) : null,
                closedAt: item.status === 'Closed' ? (item.createdAt || new Date()) : null
            });

            await tkt.save();
        }

        console.log('Bulk tickets created.');

        // 5. Recent Activity / Logs
        // Create some recent audit logs or manual activity entries if needed.
        // The Dashboard likely pulls from Ticket.statusHistory.
        // I should populate statusHistory for the Specific Scenario tickets to make them look real.

        // TKT-1001 History
        tkt1001.statusHistory.push({
            status: 'New',
            changedBy: userMap['user@apidel.com']._id,
            comment: 'Ticket created',
            timestamp: tkt1001.createdAt
        });
        tkt1001.statusHistory.push({
            status: 'Assigned',
            changedBy: userMap['admin@apidel.com']._id,
            comment: 'Assigned to Sarah Agent',
            timestamp: new Date(tkt1001.createdAt.getTime() + 3600000) // +1 hr
        });
        tkt1001.statusHistory.push({
            status: 'InProgress',
            changedBy: userMap['agent@apidel.com']._id,
            comment: 'Investigating VPN logs',
            timestamp: new Date(tkt1001.createdAt.getTime() + 7200000) // +2 hrs
        });
        await tkt1001.save();


        console.log('Database Seeded Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding Error Message:', error.message);
        console.error('Seeding Error Details:', error.errors);
        process.exit(1);
    }
};

seedDB();
