require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket'); // Path relative to src/scripts
const connectDB = require('../config/db');

const run = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const activeStatuses = ['New', 'Assigned', 'InProgress', 'Reopened', 'Escalated'];
        const activeTickets = await Ticket.find({ status: { $in: activeStatuses } }).select('ticketId subject status assignedTo createdBy createdAt');

        console.log(`Found ${activeTickets.length} active tickets:`);
        activeTickets.forEach(t => {
            console.log(`- [${t.status}] ${t.ticketId}: ${t.subject} (Assigned To: ${t.assignedTo}, Created: ${t.createdAt})`);
        });

        const allTicketsCount = await Ticket.countDocuments({});
        const resolvedCount = await Ticket.countDocuments({ status: 'Resolved' });
        const closedCount = await Ticket.countDocuments({ status: 'Closed' });

        console.log(`Total Tickets: ${allTicketsCount}`);
        console.log(`Resolved: ${resolvedCount}`);
        console.log(`Closed: ${closedCount}`);
        console.log(`Active (calculated): ${allTicketsCount - resolvedCount - closedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
