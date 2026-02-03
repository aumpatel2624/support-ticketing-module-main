const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Email Template Service
 * Manages HTML email templates with variable substitution
 */
class EmailTemplateService {
    constructor() {
        this.templatesDir = path.join(__dirname, '../templates/emails');
        this.cache = new Map();
    }

    /**
     * Load template from file
     * @param {string} templateName - Name of the template file (without extension)
     * @returns {string} Template content
     */
    loadTemplate(templateName) {
        // Check cache first
        if (this.cache.has(templateName)) {
            return this.cache.get(templateName);
        }

        const templatePath = path.join(this.templatesDir, `${templateName}.html`);
        
        try {
            const content = fs.readFileSync(templatePath, 'utf-8');
            this.cache.set(templateName, content);
            return content;
        } catch (error) {
            logger.error(`Failed to load template: ${templateName} - ${error}`);
            throw new Error(`Template not found: ${templateName}`);
        }
    }

    /**
     * Compile template with variables
     * @param {string} templateName - Name of the template
     * @param {Object} variables - Variables to substitute
     * @returns {string} Compiled HTML
     */
    compile(templateName, variables = {}) {
        let template = this.loadTemplate(templateName);

        // Replace simple variables {{variableName}}
        template = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return variables[key] !== undefined ? variables[key] : match;
        });

        // Handle conditional blocks {{#if variable}}...{{/if}}
        template = template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
            return variables[key] ? content : '';
        });

        // Handle inverse conditional blocks {{^if variable}}...{{/if}}
        template = template.replace(/\{\{\^if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
            return !variables[key] ? content : '';
        });

        return template;
    }

    /**
     * Get email subject for a template
     * @param {string} templateName - Template name
     * @param {Object} variables - Variables for subject line
     * @returns {string} Email subject
     */
    getSubject(templateName, variables = {}) {
        const subjects = {
            'ticket-created': `Ticket Created: ${variables.ticketId || 'New Ticket'}`,
            'ticket-assigned': `Ticket Assigned: ${variables.ticketId || 'New Assignment'}`,
            'ticket-status-updated': `Status Updated: ${variables.ticketId || 'Ticket Update'}`,
            'ticket-comment': `New Comment: ${variables.ticketId || 'Ticket Update'}`,
            'ticket-resolved': `Ticket Resolved: ${variables.ticketId || 'Ticket Complete'}`,
            'sla-breach': `SLA Breach Alert: ${variables.ticketId || 'Urgent'}`,
        };

        return subjects[templateName] || 'Support Ticket Notification';
    }

    /**
     * Render complete email (subject + body)
     * @param {string} templateName - Template name
     * @param {Object} variables - Template variables
     * @returns {Object} { subject, html }
     */
    render(templateName, variables = {}) {
        const html = this.compile(templateName, variables);
        const subject = this.getSubject(templateName, variables);

        return { subject, html };
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Reload a specific template (useful for development)
     * @param {string} templateName - Template name
     */
    reloadTemplate(templateName) {
        this.cache.delete(templateName);
        return this.loadTemplate(templateName);
    }

    /**
     * Get list of available templates
     * @returns {Array} List of template names
     */
    getAvailableTemplates() {
        try {
            const files = fs.readdirSync(this.templatesDir);
            return files
                .filter(file => file.endsWith('.html'))
                .map(file => file.replace('.html', ''));
        } catch (error) {
            logger.error(`Failed to list templates: ${error}`);
            return [];
        }
    }
}

module.exports = new EmailTemplateService();
