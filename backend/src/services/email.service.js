const nodemailer = require('nodemailer');
const emailTemplateService = require('./emailTemplateService');

/**
 * Email Service using Nodemailer
 */
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    /**
     * Send a generic email
     * @param {Object} options - Email options (to, subject, text, html)
     */
    async sendEmail(options) {
        const mailOptions = {
            from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            // Don't throw error to not interrupt main flow, just log it
            return null;
        }
    }

    /**
     * Send Welcome Email
     */
    async sendWelcomeEmail(user) {
        const subject = `Welcome to Support Ticketing System, ${user.name}`;
        const text = `Hi ${user.name},\n\nWelcome to our Internal Support Ticketing System. Your account has been created successfully.\n\nYour Employee ID: ${user.employeeId}\n\nYou can login at: ${process.env.FRONTEND_URL}/login\n\nBest regards,\nSupport Team`;

        return this.sendEmail({
            to: user.email,
            subject,
            text
        });
    }

    /**
     * Send Password Reset Email
     */
    async sendPasswordResetEmail(user, resetUrl) {
        const subject = 'Password Reset Request';
        const text = `You are receiving this email because you (or someone else) have requested the reset of a password.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`;
        const html = `
      <h3>Password Reset Request</h3>
      <p>You requested a password reset. Please click the button below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

        return this.sendEmail({
            to: user.email,
            subject,
            text,
            html
        });
    }

    /**
     * Send Ticket Created Email
     */
    async sendTicketCreatedEmail(user, ticket) {
        const { subject, html } = emailTemplateService.render('ticket-created', {
            userName: user.name,
            ticketId: ticket.ticketId,
            ticketSubject: ticket.subject,
            ticketPriority: ticket.priority,
            ticketStatus: ticket.status,
            createdDate: new Date(ticket.createdAt).toLocaleDateString(),
            ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket._id}`,
            unsubscribeUrl: `${process.env.FRONTEND_URL}/settings/notifications`
        });

        const text = `Hi ${user.name},\n\nYour ticket "${ticket.subject}" has been created successfully.\n\nTicket ID: ${ticket.ticketId}\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\n\nYou can track your ticket at: ${process.env.FRONTEND_URL}/tickets/${ticket._id}\n\nBest regards,\nSupport Team`;

        return this.sendEmail({
            to: user.email,
            subject,
            text,
            html
        });
    }

    /**
     * Send Ticket Status Update Email
     */
    async sendStatusUpdateEmail(user, ticket, oldStatus, newStatus, comment = null) {
        const { subject, html } = emailTemplateService.render('ticket-status-updated', {
            userName: user.name,
            ticketId: ticket.ticketId,
            ticketSubject: ticket.subject,
            oldStatus,
            newStatus,
            updatedByName: ticket.updatedBy?.name || 'Support Team',
            updatedDate: new Date().toLocaleDateString(),
            comment,
            ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket._id}`
        });

        const text = `Hi ${user.name},\n\nThe status of your ticket "${ticket.subject}" has been updated from ${oldStatus} to ${newStatus}.\n\nTicket ID: ${ticket.ticketId}\n\nCheck details at: ${process.env.FRONTEND_URL}/tickets/${ticket._id}\n\nBest regards,\nSupport Team`;

        return this.sendEmail({
            to: user.email,
            subject,
            text,
            html
        });
    }

    /**
     * Send Ticket Assigned Email
     */
    async sendTicketAssignedEmail(assignee, ticket, assignedBy) {
        const { subject, html } = emailTemplateService.render('ticket-assigned', {
            userName: assignee.name,
            ticketId: ticket.ticketId,
            ticketSubject: ticket.subject,
            ticketDescription: ticket.description?.substring(0, 200) + (ticket.description?.length > 200 ? '...' : ''),
            ticketPriority: ticket.priority,
            ticketStatus: ticket.status,
            createdByName: ticket.createdBy?.name || 'Unknown',
            assignedByName: assignedBy?.name || 'System',
            assignedDate: new Date().toLocaleDateString(),
            ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket._id}`
        });

        const text = `Hi ${assignee.name},\n\nA new ticket has been assigned to you.\n\nTicket ID: ${ticket.ticketId}\nSubject: ${ticket.subject}\n\nView ticket at: ${process.env.FRONTEND_URL}/tickets/${ticket._id}\n\nBest regards,\nSystem`;

        return this.sendEmail({
            to: assignee.email,
            subject,
            text,
            html
        });
    }

    /**
     * Send New Comment Email
     */
    async sendCommentEmail(user, ticket, comment, commentAuthor) {
        const { subject, html } = emailTemplateService.render('ticket-comment', {
            userName: user.name,
            ticketId: ticket.ticketId,
            ticketSubject: ticket.subject,
            commentAuthor: commentAuthor.name,
            authorInitials: commentAuthor.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
            commentDate: new Date(comment.createdAt).toLocaleDateString(),
            commentText: comment.text,
            ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket._id}`
        });

        const text = `Hi ${user.name},\n\nA new comment has been added to your ticket "${ticket.subject}" by ${commentAuthor.name}.\n\nComment: ${comment.text}\n\nView at: ${process.env.FRONTEND_URL}/tickets/${ticket._id}\n\nBest regards,\nSupport Team`;

        return this.sendEmail({
            to: user.email,
            subject,
            text,
            html
        });
    }

    /**
     * Send Ticket Resolved Email
     */
    async sendTicketResolvedEmail(user, ticket, resolvedBy, resolutionNotes = null) {
        const resolutionTime = ticket.resolvedAt && ticket.createdAt
            ? Math.round((new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60)) + ' hours'
            : 'N/A';

        const { subject, html } = emailTemplateService.render('ticket-resolved', {
            userName: user.name,
            ticketId: ticket.ticketId,
            ticketSubject: ticket.subject,
            resolvedByName: resolvedBy?.name || 'Support Team',
            resolvedDate: new Date(ticket.resolvedAt).toLocaleDateString(),
            resolutionTime,
            resolutionNotes,
            ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket._id}`,
            ratingUrl: `${process.env.FRONTEND_URL}/tickets/${ticket._id}?rate=true`
        });

        const text = `Hi ${user.name},\n\nGreat news! Your ticket "${ticket.subject}" has been resolved.\n\nTicket ID: ${ticket.ticketId}\nResolved by: ${resolvedBy?.name || 'Support Team'}\n\nView at: ${process.env.FRONTEND_URL}/tickets/${ticket._id}\n\nPlease rate your experience.\n\nBest regards,\nSupport Team`;

        return this.sendEmail({
            to: user.email,
            subject,
            text,
            html
        });
    }

    /**
     * Send SLA Breach Email
     */
    async sendSLABreachEmail(user, ticket, slaInfo) {
        const { subject, html } = emailTemplateService.render('sla-breach', {
            userName: user.name,
            ticketId: ticket.ticketId,
            ticketSubject: ticket.subject,
            ticketPriority: ticket.priority,
            createdDate: new Date(ticket.createdAt).toLocaleDateString(),
            assignedToName: ticket.assignedTo?.name || 'Unassigned',
            slaTargetTime: slaInfo.targetTime,
            currentStatus: slaInfo.status,
            timeOverdue: slaInfo.timeOverdue,
            alertTime: new Date().toLocaleString(),
            ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket._id}`
        });

        const text = `🚨 URGENT: SLA Breach Alert\n\nTicket ${ticket.ticketId} has exceeded its SLA timeline.\n\nSubject: ${ticket.subject}\nTime Overdue: ${slaInfo.timeOverdue}\n\nView immediately: ${process.env.FRONTEND_URL}/tickets/${ticket._id}\n\nSupport Management`;

        return this.sendEmail({
            to: user.email,
            subject,
            text,
            html
        });
    }
}

module.exports = new EmailService();
