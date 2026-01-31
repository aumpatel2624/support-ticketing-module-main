require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const seedDB = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected...');

        // ========== STEP 1: Clear all existing data ==========
        console.log('\n--- Clearing all existing data ---');
        await Promise.all([
            User.deleteMany({}),
            Department.deleteMany({}),
            Category.deleteMany({}),
            Ticket.deleteMany({}),
            Notification.deleteMany({}),
            AuditLog.deleteMany({})
        ]);
        console.log('✓ All data cleared');

        // ========== STEP 2: Create SuperAdmin ==========
        console.log('\n--- Creating SuperAdmin ---');
        const superAdmin = await User.create({
            employeeId: 'EMP0001',
            name: 'Alice Superadmin',
            email: 'superadmin@company.com',
            password: 'Password123',
            role: 'SuperAdmin',
            permissions: {
                canAddMembers: true,
                canAssignTickets: true,
                canManageCategories: true,
                accessLevel: 'full'
            },
            isActive: true
        });
        console.log(`✓ SuperAdmin created: ${superAdmin.name} (${superAdmin.email})`);

        // ========== STEP 3: Create Departments ==========
        console.log('\n--- Creating Departments ---');
        const departmentsData = [
            {
                name: 'IT',
                code: 'IT',
                description: 'Information Technology and Support',
                icon: 'monitor',
                color: '#3B82F6'
            },
            {
                name: 'HR',
                code: 'HR',
                description: 'Human Resources and Payroll',
                icon: 'users',
                color: '#EC4899'
            },
            {
                name: 'Facility Management',
                code: 'FM',
                description: 'Facility Management and Maintenance',
                icon: 'home',
                color: '#10B981'
            }
        ];

        const departments = {};
        for (const deptData of departmentsData) {
            const dept = await Department.create({
                ...deptData,
                createdBy: superAdmin._id,
                isActive: true
            });
            departments[deptData.name] = dept;
            console.log(`✓ Department created: ${dept.name}`);
        }

        // ========== STEP 4: Create Users ==========
        console.log('\n--- Creating Users ---');
        const users = {};

        // Superadmin reference
        users['superadmin'] = superAdmin;

        // Department Heads (1 per department)
        const headsData = [
            {
                employeeId: 'EMP0002',
                name: 'John IT Head',
                email: 'john.head@company.com',
                department: 'IT',
                role: 'Admin'
            },
            {
                employeeId: 'EMP0003',
                name: 'Sarah HR Head',
                email: 'sarah.head@company.com',
                department: 'HR',
                role: 'Admin'
            },
            {
                employeeId: 'EMP0004',
                name: 'Michael FM Head',
                email: 'michael.head@company.com',
                department: 'Facility Management',
                role: 'Admin'
            }
        ];

        const heads = {};
        for (const headData of headsData) {
            const head = await User.create({
                employeeId: headData.employeeId,
                name: headData.name,
                email: headData.email,
                password: 'Password123',
                role: headData.role,
                department: departments[headData.department]._id,
                permissions: {
                    canAddMembers: true,
                    canAssignTickets: true,
                    canManageCategories: true,
                    accessLevel: 'full'
                },
                isActive: true
            });
            heads[headData.department] = head;
            users[`${headData.department}_head`] = head;
            console.log(`✓ Head created: ${head.name} (${headData.department})`);
        }

        // Update department heads
        for (const [deptName, head] of Object.entries(heads)) {
            departments[deptName].headUserId = head._id;
            await departments[deptName].save();
        }

        // Team Members (2 per department)
        const teamMembersData = [
            // IT Team Members
            {
                employeeId: 'EMP0005',
                name: 'David Support',
                email: 'david.support@company.com',
                department: 'IT'
            },
            {
                employeeId: 'EMP0006',
                name: 'Emma Support',
                email: 'emma.support@company.com',
                department: 'IT'
            },
            // HR Team Members
            {
                employeeId: 'EMP0007',
                name: 'Robert Recruiter',
                email: 'robert.recruiter@company.com',
                department: 'HR'
            },
            {
                employeeId: 'EMP0008',
                name: 'Lisa Payroll',
                email: 'lisa.payroll@company.com',
                department: 'HR'
            },
            // Facility Management Team Members
            {
                employeeId: 'EMP0009',
                name: 'James Maintenance',
                email: 'james.maintenance@company.com',
                department: 'Facility Management'
            },
            {
                employeeId: 'EMP0010',
                name: 'Patricia Security',
                email: 'patricia.security@company.com',
                department: 'Facility Management'
            }
        ];

        const teamMembers = {};
        for (const memberData of teamMembersData) {
            const member = await User.create({
                employeeId: memberData.employeeId,
                name: memberData.name,
                email: memberData.email,
                password: 'Password123',
                role: 'TeamMember',
                department: departments[memberData.department]._id,
                permissions: {
                    canAddMembers: false,
                    canAssignTickets: false,
                    canManageCategories: false,
                    accessLevel: 'edit'
                },
                isActive: true
            });
            users[memberData.email] = member;
            if (!teamMembers[memberData.department]) {
                teamMembers[memberData.department] = [];
            }
            teamMembers[memberData.department].push(member);
            console.log(`✓ Team Member created: ${member.name} (${memberData.department})`);
        }

        // Normal Users (3 total)
        const normalUsersData = [
            {
                employeeId: 'EMP0011',
                name: 'Tom Employee',
                email: 'tom.employee@company.com'
            },
            {
                employeeId: 'EMP0012',
                name: 'Jennifer Employee',
                email: 'jennifer.employee@company.com'
            },
            {
                employeeId: 'EMP0013',
                name: 'Mark Employee',
                email: 'mark.employee@company.com'
            }
        ];

        const normalUsers = [];
        for (const userData of normalUsersData) {
            const user = await User.create({
                employeeId: userData.employeeId,
                name: userData.name,
                email: userData.email,
                password: 'Password123',
                role: 'NormalUser',
                department: departments['IT']._id, // Default department
                permissions: {
                    canAddMembers: false,
                    canAssignTickets: false,
                    canManageCategories: false,
                    accessLevel: 'read'
                },
                isActive: true
            });
            users[userData.email] = user;
            normalUsers.push(user);
            console.log(`✓ Normal User created: ${user.name}`);
        }

        // ========== STEP 5: Create Categories ==========
        console.log('\n--- Creating Categories ---');
        const categoriesData = {
            'IT': [
                {
                    name: 'Hardware Issues',
                    description: 'Computer hardware and peripherals problems',
                    priority: 'High',
                    sla: 24
                },
                {
                    name: 'Software Installation',
                    description: 'Software installation and licensing issues',
                    priority: 'Medium',
                    sla: 48
                },
                {
                    name: 'Network Issues',
                    description: 'Network connectivity and VPN problems',
                    priority: 'High',
                    sla: 12
                },
                {
                    name: 'Access Control',
                    description: 'User account access and permissions',
                    priority: 'Urgent',
                    sla: 4
                }
            ],
            'HR': [
                {
                    name: 'Payroll Issues',
                    description: 'Salary and payroll related matters',
                    priority: 'High',
                    sla: 48
                },
                {
                    name: 'Leave Management',
                    description: 'Leave requests and approvals',
                    priority: 'Medium',
                    sla: 72
                },
                {
                    name: 'Benefits Enrollment',
                    description: 'Health insurance and benefits enrollment',
                    priority: 'Medium',
                    sla: 96
                },
                {
                    name: 'Recruitment',
                    description: 'Hiring and recruitment requests',
                    priority: 'Low',
                    sla: 120
                }
            ],
            'Facility Management': [
                {
                    name: 'Maintenance',
                    description: 'Building maintenance and repairs',
                    priority: 'Medium',
                    sla: 72
                },
                {
                    name: 'Safety Issues',
                    description: 'Safety concerns and hazards',
                    priority: 'Urgent',
                    sla: 4
                },
                {
                    name: 'Facilities Request',
                    description: 'Facilities and space requests',
                    priority: 'Low',
                    sla: 120
                },
                {
                    name: 'Cleaning and Hygiene',
                    description: 'Cleaning and sanitation issues',
                    priority: 'Medium',
                    sla: 24
                }
            ]
        };

        const categories = {};
        for (const [deptName, catList] of Object.entries(categoriesData)) {
            categories[deptName] = {};
            for (const catData of catList) {
                const category = await Category.create({
                    name: catData.name,
                    description: catData.description,
                    departmentId: departments[deptName]._id,
                    defaultPriority: catData.priority,
                    defaultSLA: catData.sla,
                    createdBy: superAdmin._id,
                    isActive: true
                });
                categories[deptName][catData.name] = category;
                console.log(`✓ Category created: ${catData.name} (${deptName})`);
            }
        }

        // ========== STEP 6: Create Tickets ==========
        console.log('\n--- Creating Tickets ---');

        const priorities = ['Low', 'Medium', 'High', 'Urgent'];
        const statuses = ['New', 'Assigned', 'InProgress', 'Pending', 'Completed', 'Closed'];
        const ticketSubjects = {
            'IT': [
                'Cannot access email on new laptop',
                'Printer driver installation fails',
                'VPN connection timeout',
                'Monitor resolution problems',
                'Keyboard not recognized',
                'Software license renewal'
            ],
            'HR': [
                'Salary discrepancy in last paycheck',
                'Leave balance not updated',
                'Benefits enrollment assistance needed',
                'Employee contract renewal',
                'Internal job transfer request',
                'Performance review feedback'
            ],
            'Facility Management': [
                'Broken air conditioning in conference room',
                'Leaking faucet in restroom',
                'Damaged ceiling tile needs replacement',
                'Parking lot lighting repair needed',
                'Unauthorized access control issue',
                'Cleaning supplies low in inventory'
            ]
        };

        let ticketCounter = 1;

        for (const [deptName, categories_dict] of Object.entries(categories)) {
            const categoryKeys = Object.keys(categories_dict);
            const dept = departments[deptName];
            const deptHeads = [heads[deptName]];
            const deptTeamMembers = teamMembers[deptName] || [];
            const subjects = ticketSubjects[deptName];

            // Create 5-6 tickets per department
            const ticketCount = Math.floor(Math.random() * 2) + 5; // 5 or 6
            for (let i = 0; i < ticketCount; i++) {
                const categoryName = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
                const category = categories_dict[categoryName];
                const priority = priorities[Math.floor(Math.random() * priorities.length)];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const creator = normalUsers[Math.floor(Math.random() * normalUsers.length)];
                const assignee = (status !== 'New' && deptTeamMembers.length > 0)
                    ? deptTeamMembers[Math.floor(Math.random() * deptTeamMembers.length)]
                    : null;

                // Create ticket with calculated SLA
                const ticket = new Ticket({
                    subject: subjects[i % subjects.length],
                    description: `Detailed description for ${subjects[i % subjects.length]}. This ticket requires attention and resolution.`,
                    departmentId: dept._id,
                    categoryId: category._id,
                    priority: priority,
                    status: status,
                    createdBy: creator._id,
                    assignedTo: assignee ? assignee._id : null,
                    isActive: true
                });

                // Calculate SLA deadline
                await ticket.calculateSLA();

                // Add status history
                if (status !== 'New') {
                    ticket.addStatusHistory('New', creator._id, 'Ticket created');
                    if (assignee && status !== 'Assigned') {
                        ticket.addStatusHistory('Assigned', assignee._id, 'Ticket assigned');
                    }
                    if (status !== 'Assigned' && status !== 'New') {
                        ticket.addStatusHistory(status, assignee ? assignee._id : creator._id, `Status changed to ${status}`);
                    }
                }

                // Set resolved/closed timestamps for completed tickets
                if (['Completed', 'Closed'].includes(status)) {
                    ticket.resolvedAt = new Date();
                    if (status === 'Closed') {
                        ticket.closedAt = new Date();
                    }
                }

                await ticket.save();
                console.log(`✓ Ticket created: ${ticket.ticketId} - ${ticket.subject} (${deptName})`);
                ticketCounter++;
            }
        }

        console.log('\n╔════════════════════════════════════════╗');
        console.log('║   Database Seeded Successfully!        ║');
        console.log('╚════════════════════════════════════════╝');
        console.log('\nSummary:');
        console.log('✓ 1 SuperAdmin created');
        console.log('✓ 3 Departments created (IT, HR, Facility Management)');
        console.log('✓ 3 Department Heads created (1 per department)');
        console.log('✓ 6 Team Members created (2 per department)');
        console.log('✓ 3 Normal Users created');
        console.log('✓ 16 Categories created (4 per department)');
        console.log('✓ 16-18 Tickets created (5-6 per department)');
        console.log('\nLogin Credentials:');
        console.log('SuperAdmin: superadmin@company.com / Password123');
        console.log('IT Head: john.head@company.com / Password123');
        console.log('HR Head: sarah.head@company.com / Password123');
        console.log('FM Head: michael.head@company.com / Password123');
        console.log('Normal User: tom.employee@company.com / Password123');

        process.exit(0);
    } catch (error) {
        console.error('Seeding Error:', error.message);
        if (error.errors) {
            console.error('Details:', error.errors);
        }
        process.exit(1);
    }
};

seedDB();
