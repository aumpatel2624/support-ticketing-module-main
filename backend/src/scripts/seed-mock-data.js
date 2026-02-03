require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const SystemSettings = require('../models/SystemSettings');

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
            AuditLog.deleteMany({}),
            SystemSettings.deleteMany({})
        ]);
        console.log('✓ All data cleared');

        // ========== STEP 1.5: Seed System Settings ==========
        console.log('\n--- Seeding System Settings ---');
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
        console.log('✓ System Settings created');

        // ========== STEP 2: Create SuperAdmin ==========
        console.log('\n--- Creating SuperAdmin ---');
        const superAdmin = await User.create({
            employeeId: 'EMP0001',
            name: 'Alice Superadmin',
            email: 'superadmin@test.com',
            password: '123456',
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
                email: 'it.head@test.com',
                department: 'IT',
                role: 'Admin'
            },
            {
                employeeId: 'EMP0003',
                name: 'Sarah HR Head',
                email: 'hr.head@test.com',
                department: 'HR',
                role: 'Admin'
            },
            {
                employeeId: 'EMP0004',
                name: 'Michael FM Head',
                email: 'fm.head@test.com',
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
                password: '123456',
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
                email: 'it.support1@test.com',
                department: 'IT'
            },
            {
                employeeId: 'EMP0006',
                name: 'Emma Support',
                email: 'it.support2@test.com',
                department: 'IT'
            },
            // HR Team Members
            {
                employeeId: 'EMP0007',
                name: 'Robert Recruiter',
                email: 'hr.support1@test.com',
                department: 'HR'
            },
            {
                employeeId: 'EMP0008',
                name: 'Lisa Payroll',
                email: 'hr.support2@test.com',
                department: 'HR'
            },
            // Facility Management Team Members
            {
                employeeId: 'EMP0009',
                name: 'James Maintenance',
                email: 'fm.support1@test.com',
                department: 'Facility Management'
            },
            {
                employeeId: 'EMP0010',
                name: 'Patricia Security',
                email: 'fm.support2@test.com',
                department: 'Facility Management'
            }
        ];

        const teamMembers = {};
        for (const memberData of teamMembersData) {
            const member = await User.create({
                employeeId: memberData.employeeId,
                name: memberData.name,
                email: memberData.email,
                password: '123456',
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
                email: 'user1@test.com'
            },
            {
                employeeId: 'EMP0012',
                name: 'Jennifer Employee',
                email: 'user2@test.com'
            },
            {
                employeeId: 'EMP0013',
                name: 'Mark Employee',
                email: 'user3@test.com'
            }
        ];

        const normalUsers = [];
        for (const userData of normalUsersData) {
            const user = await User.create({
                employeeId: userData.employeeId,
                name: userData.name,
                email: userData.email,
                password: '123456',
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
                    priority: 'High'
                },
                {
                    name: 'Software Installation',
                    description: 'Software installation and licensing issues',
                    priority: 'Medium'
                },
                {
                    name: 'Network Issues',
                    description: 'Network connectivity and VPN problems',
                    priority: 'High'
                },
                {
                    name: 'Access Control',
                    description: 'User account access and permissions',
                    priority: 'Urgent'
                }
            ],
            'HR': [
                {
                    name: 'Payroll Issues',
                    description: 'Salary and payroll related matters',
                    priority: 'High'
                },
                {
                    name: 'Leave Management',
                    description: 'Leave requests and approvals',
                    priority: 'Medium'
                },
                {
                    name: 'Benefits Enrollment',
                    description: 'Health insurance and benefits enrollment',
                    priority: 'Medium'
                },
                {
                    name: 'Recruitment',
                    description: 'Hiring and recruitment requests',
                    priority: 'Low'
                }
            ],
            'Facility Management': [
                {
                    name: 'Maintenance',
                    description: 'Building maintenance and repairs',
                    priority: 'Medium'
                },
                {
                    name: 'Safety Issues',
                    description: 'Safety concerns and hazards',
                    priority: 'Urgent'
                },
                {
                    name: 'Facilities Request',
                    description: 'Facilities and space requests',
                    priority: 'Low'
                },
                {
                    name: 'Cleaning and Hygiene',
                    description: 'Cleaning and sanitation issues',
                    priority: 'Medium'
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
        const statuses = ['New', 'Assigned', 'InProgress', 'Completed', 'Closed', 'Escalated'];
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
                        // Add feedback for closed tickets to test FeedbackResultCard UI
                        const feedbackTexts = [
                            'Great support! Issue was resolved quickly and professionally.',
                            'Very satisfied with the resolution. The team was responsive.',
                            'Good service overall. Would appreciate faster response time.',
                            'Excellent work! The technician was very helpful and thorough.',
                            'Issue resolved but took longer than expected.',
                        ];
                        ticket.rating = Math.floor(Math.random() * 3) + 3; // Random rating 3-5
                        ticket.feedback = feedbackTexts[Math.floor(Math.random() * feedbackTexts.length)];
                        ticket.feedbackGiven = true;
                        ticket.feedbackGivenAt = new Date();
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
        console.log('\nLogin Credentials (All Users):');
        console.log('─────────────────────────────────────────────────────────────');
        console.log('SUPERADMIN:');
        console.log('  superadmin@test.com / 123456');
        console.log('\nDEPARTMENT HEADS (Admin role):');
        console.log('  it.head@test.com / 123456 (IT)');
        console.log('  hr.head@test.com / 123456 (HR)');
        console.log('  fm.head@test.com / 123456 (Facility Management)');
        console.log('\nTEAM MEMBERS:');
        console.log('  it.support1@test.com / 123456 (IT)');
        console.log('  it.support2@test.com / 123456 (IT)');
        console.log('  hr.support1@test.com / 123456 (HR)');
        console.log('  hr.support2@test.com / 123456 (HR)');
        console.log('  fm.support1@test.com / 123456 (Facility Management)');
        console.log('  fm.support2@test.com / 123456 (Facility Management)');
        console.log('\nNORMAL USERS:');
        console.log('  user1@test.com / 123456');
        console.log('  user2@test.com / 123456');
        console.log('  user3@test.com / 123456');
        console.log('─────────────────────────────────────────────────────────────');

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
