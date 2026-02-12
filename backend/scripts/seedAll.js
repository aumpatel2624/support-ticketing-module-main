const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Category = require('../src/models/Category');
const Ticket = require('../src/models/Ticket');
const SystemSettings = require('../src/models/SystemSettings');

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

        // Seed System Settings (needed for SLA calculation)
        await SystemSettings.create({
            companyName: 'Apidel Technologies',
            companyLogo: null,
            brandColor: '#3b82f6',
            slaDefaults: {
                lowPriority: 72,
                mediumPriority: 48,
                highPriority: 24,
                urgentPriority: 4
            },
            features: {
                kanbanView: true,
                cardView: true,
                tableView: true,
                darkMode: false
            }
        });
        console.log('Created System Settings');

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


        // 4. Create Categories (4 per department)
        console.log('Seeding Categories...');

        // IT Categories
        const itCategories = await Category.create([
            { name: 'Hardware Issue', departmentId: itDept._id, defaultPriority: 'High', createdBy: superAdmin._id },
            { name: 'Software Issue', departmentId: itDept._id, defaultPriority: 'Medium', createdBy: superAdmin._id },
            { name: 'Network Issue', departmentId: itDept._id, defaultPriority: 'Urgent', createdBy: superAdmin._id },
            { name: 'Access Request', departmentId: itDept._id, defaultPriority: 'Low', createdBy: superAdmin._id }
        ]);

        // HR Categories (added 4th: Benefits Enrollment)
        const hrCategories = await Category.create([
            { name: 'Payroll Inquiry', departmentId: hrDept._id, defaultPriority: 'High', createdBy: superAdmin._id },
            { name: 'Leave Request', departmentId: hrDept._id, defaultPriority: 'Medium', createdBy: superAdmin._id },
            { name: 'Policy Question', departmentId: hrDept._id, defaultPriority: 'Low', createdBy: superAdmin._id },
            { name: 'Benefits Enrollment', departmentId: hrDept._id, defaultPriority: 'Medium', createdBy: superAdmin._id }
        ]);

        // FM Categories (added 4th: Space Request)
        const fmCategories = await Category.create([
            { name: 'Maintenance Request', departmentId: fmDept._id, defaultPriority: 'Medium', createdBy: superAdmin._id },
            { name: 'Cleaning Request', departmentId: fmDept._id, defaultPriority: 'Low', createdBy: superAdmin._id },
            { name: 'Security Issue', departmentId: fmDept._id, defaultPriority: 'Urgent', createdBy: superAdmin._id },
            { name: 'Space Request', departmentId: fmDept._id, defaultPriority: 'Low', createdBy: superAdmin._id }
        ]);
        console.log('Created 12 Categories (4 per department)');

        // 5. Create Tickets (4 per department, 1 per category = 12 total)
        console.log('Seeding Tickets...');

        const deptTicketData = [
            {
                dept: itDept,
                categories: itCategories,
                members: [itMember],
                subjects: [
                    'Cannot access email on new laptop',
                    'Printer driver installation fails',
                    'VPN connection timeout',
                    'Need access to internal dashboard'
                ]
            },
            {
                dept: hrDept,
                categories: hrCategories,
                members: [hrMember],
                subjects: [
                    'Salary discrepancy in last paycheck',
                    'Leave balance not updated',
                    'Question about remote work policy',
                    'Benefits enrollment assistance needed'
                ]
            },
            {
                dept: fmDept,
                categories: fmCategories,
                members: [],
                subjects: [
                    'Broken air conditioning in conference room',
                    'Cleaning supplies low in inventory',
                    'Unauthorized access to server room',
                    'Need additional desk space for new hire'
                ]
            }
        ];

        const priorities = ['Low', 'Medium', 'High', 'Urgent'];
        const statuses = ['New', 'Assigned', 'InProgress', 'Resolved'];

        for (const data of deptTicketData) {
            for (let i = 0; i < 4; i++) {
                const status = statuses[i];
                const assignee = (status !== 'New' && data.members.length > 0)
                    ? data.members[i % data.members.length]
                    : null;

                const ticket = new Ticket({
                    subject: data.subjects[i],
                    description: `Detailed description for: ${data.subjects[i]}. This ticket requires attention and resolution.`,
                    departmentId: data.dept._id,
                    categoryId: data.categories[i]._id,
                    priority: priorities[i],
                    status: status,
                    createdBy: normalUser._id,
                    assignedTo: assignee ? assignee._id : null
                });

                // Calculate SLA deadline
                await ticket.calculateSLA();

                // Add status history
                if (status !== 'New') {
                    ticket.statusHistory.push({ status: 'New', changedBy: normalUser._id, comment: 'Ticket created' });
                    if (assignee && status !== 'Assigned') {
                        ticket.statusHistory.push({ status: 'Assigned', changedBy: assignee._id, comment: 'Ticket assigned' });
                    }
                    if (status !== 'Assigned' && status !== 'New') {
                        ticket.statusHistory.push({ status, changedBy: assignee ? assignee._id : normalUser._id, comment: `Status changed to ${status}` });
                    }
                }

                if (status === 'Resolved') {
                    ticket.resolvedAt = new Date();
                }

                await ticket.save();
                console.log(`✓ Ticket: ${ticket.ticketId} - ${data.subjects[i]} [${data.categories[i].name}] (${data.dept.name})`);
            }
        }
        console.log('Created 12 Tickets (4 per department, 1 per category)');

        console.log('\nSeeding Complete!');
        process.exit();

    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();

