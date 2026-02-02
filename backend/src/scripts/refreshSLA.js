require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Category = require('../models/Category'); // Required for populating if needed

// Connect to DB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected for SLA Refresh'))
    .catch(err => console.error(err));

async function refreshSLAs() {
    try {
        console.log('Checking for SLA breaches (TEST MODE: Minutes)...');

        // Find all non-closed tickets
        const tickets = await Ticket.find({
            status: { $nin: ['Closed', 'Completed'] }
        });

        console.log(`Found ${tickets.length} active tickets to check.`);
        let updatedCount = 0;

        for (const ticket of tickets) {
            // Check if breached
            const isBreached = ticket.checkSLABreach();

            // Check if it was already breached in DB
            if (isBreached && !ticket.slaBreach) {
                // If the method returns true but DB says false, we need to save
                // Note: checkSLABreach() modifies this.slaBreach internally in memory

                await ticket.save();
                console.log(`❌ Breaached: Ticket ${ticket.ticketId} (Deadline: ${ticket.slaDeadline?.toLocaleTimeString()})`);
                updatedCount++;
            } else if (isBreached) {
                console.log(`⚠️  Already Breached: Ticket ${ticket.ticketId}`);
            } else {
                console.log(`✅ On Track: Ticket ${ticket.ticketId}`);
            }
        }

        console.log('-----------------------------------');
        console.log(`Refresh Complete. Updated ${updatedCount} tickets.`);

    } catch (error) {
        console.error('Error refreshing SLAs:', error);
    } finally {
        mongoose.disconnect();
        process.exit();
    }
}

refreshSLAs();
