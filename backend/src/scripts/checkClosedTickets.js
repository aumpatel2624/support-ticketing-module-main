require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Category = require('../models/Category');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('DB Connected'))
    .catch(err => console.error(err));

async function checkClosedTickets() {
    try {
        console.log('--- Checking CLOSED/COMPLETED Tickets ---');

        const closedTickets = await Ticket.find({
            status: { $in: ['Closed', 'Completed'] }
        }).sort({ updatedAt: -1 }).limit(10);

        if (closedTickets.length === 0) {
            console.log('No closed tickets found.');
        }

        for (const ticket of closedTickets) {
            console.log(`\nTicket: ${ticket.ticketId}`);
            console.log(`Status: ${ticket.status}`);
            console.log(`SLA Breached Flag: ${ticket.slaBreach}`); // This is what the dashboard counts
            console.log(`Created: ${ticket.createdAt.toLocaleTimeString()}`);
            console.log(`Deadline: ${ticket.slaDeadline?.toLocaleTimeString()}`);
            console.log(`Resolved: ${ticket.resolvedAt?.toLocaleTimeString() || 'N/A'}`);

            // Check if it SHOULD have been breached
            if (ticket.resolvedAt && ticket.slaDeadline) {
                if (ticket.resolvedAt > ticket.slaDeadline) {
                    console.log('⚠️  ANALYSIS: This ticket MISSED the deadline, but flag might be ' + ticket.slaBreach);

                    if (!ticket.slaBreach) {
                        console.log('>> FIXING SLA FLAG...');
                        ticket.slaBreach = true;
                        await ticket.save();
                        console.log('>> FIXED! Dashboard should now update.');
                    }
                } else {
                    console.log('✅  ANALYSIS: Met the deadline.');
                }
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
        process.exit();
    }
}

checkClosedTickets();
