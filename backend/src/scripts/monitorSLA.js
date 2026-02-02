require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Category = require('../models/Category');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('👀 Monitoring Newest Ticket for SLA Status...');
        console.log('Create a new ticket now!');
        console.log('-------------------------------------------');
        monitorNewestTicket();
    })
    .catch(err => console.error(err));

async function monitorNewestTicket() {
    let lastStatus = '';

    // Check every 10 seconds
    setInterval(async () => {
        try {
            // Get the absolute newest ticket
            const ticket = await Ticket.findOne().sort({ createdAt: -1 });

            if (!ticket) {
                process.stdout.write('.');
                return;
            }

            // Force check breach (in memory)
            const isNowBreached = ticket.checkSLABreach();

            // Calculate time remaining
            const now = new Date();
            const deadline = ticket.slaDeadline;
            let timeRemaining = 'N/A';
            let status = 'Unknown';

            if (deadline) {
                const diffMs = deadline - now;
                const diffMins = Math.ceil(diffMs / 60000);

                if (diffMs < 0) {
                    timeRemaining = `OVERDUE by ${Math.abs(diffMins)} mins`;
                } else {
                    timeRemaining = `${diffMins} mins left`;
                }

                // Determine Status similar to Dashboard
                if (ticket.slaBreach || isNowBreached) status = '❌ BREACHED';
                else if (diffMs < (2 * 60 * 1000)) status = '⚠️  AT RISK (<2m)';
                else status = '✅ ON TRACK';
            }

            // Update DB if breach logic changed
            if (isNowBreached && !ticket.slaBreach) {
                ticket.slaBreach = true;
                await ticket.save();
                console.log('\n>>> DB UPDATED: Marked as Breached in Database! <<<');
            }

            // Log status
            const logMsg = `[${new Date().toLocaleTimeString()}] Ticket: ${ticket.ticketId} | Status: ${status} | Time: ${timeRemaining}`;

            if (logMsg !== lastStatus) {
                console.log(logMsg);
                lastStatus = logMsg;
            }

        } catch (error) {
            console.error('Error:', error.message);
        }
    }, 5000); // Check every 5 seconds
}
