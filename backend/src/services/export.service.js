const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Export Service
 * Handles export of reports to PDF, Excel, and CSV formats
 */
class ExportService {
    constructor() {
        this.templatesDir = path.join(__dirname, '../templates/exports');
        // Ensure templates directory exists
        if (!fs.existsSync(this.templatesDir)) {
            fs.mkdirSync(this.templatesDir, { recursive: true });
        }
    }

    /**
     * Export data to Excel format
     * @param {Array} data - Array of data objects
     * @param {Object} options - Export options
     * @returns {Buffer} Excel file buffer
     */
    async exportToExcel(data, options = {}) {
        const {
            title = 'Report',
            headers = [],
            columns = [],
            sheetName = 'Data',
            includeCharts = false
        } = options;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Ticketing System';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(sheetName);

        // Add title
        worksheet.mergeCells('A1:' + String.fromCharCode(65 + columns.length - 1) + '1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = title;
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };
        worksheet.getRow(1).height = 30;

        // Add headers
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '3B82F6' }
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 25;

        // Add data rows
        data.forEach((item, index) => {
            const rowData = columns.map(col => {
                const value = this.getNestedValue(item, col.key);
                return col.format ? col.format(value, item) : value;
            });
            const row = worksheet.addRow(rowData);
            
            // Alternate row colors
            if (index % 2 === 1) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F3F4F6' }
                };
            }
        });

        // Auto-fit columns
        columns.forEach((col, index) => {
            const column = worksheet.getColumn(index + 1);
            column.width = col.width || 15;
        });

        // Add borders to all cells
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Freeze header row
        worksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: 2 }
        ];

        return await workbook.xlsx.writeBuffer();
    }

    /**
     * Export data to CSV format
     * @param {Array} data - Array of data objects
     * @param {Object} options - Export options
     * @returns {string} CSV content
     */
    exportToCSV(data, options = {}) {
        const {
            headers = [],
            columns = []
        } = options;

        // Create header row
        let csv = headers.join(',') + '\n';

        // Add data rows
        data.forEach(item => {
            const row = columns.map(col => {
                const value = this.getNestedValue(item, col.key);
                const formatted = col.format ? col.format(value, item) : value;
                // Escape commas and quotes
                const escaped = String(formatted || '').replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csv += row.join(',') + '\n';
        });

        return csv;
    }

    /**
     * Export data to PDF format
     * @param {Array} data - Array of data objects
     * @param {Object} options - Export options
     * @returns {Buffer} PDF buffer
     */
    async exportToPDF(data, options = {}) {
        const {
            title = 'Report',
            headers = [],
            columns = [],
            summary = null,
            charts = null
        } = options;

        const launchOptions = {
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        };
        // Use system Chromium on Linux servers (set via PUPPETEER_EXECUTABLE_PATH env var)
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }
        const browser = await puppeteer.launch(launchOptions);

        try {
            const page = await browser.newPage();

            // Generate HTML content
            const html = this.generatePDFHTML(data, { title, headers, columns, summary, charts });
            
            await page.setContent(html, { waitUntil: 'networkidle0' });

            // Generate PDF
            const pdf = await page.pdf({
                format: 'A4',
                landscape: columns.length > 6,
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });

            return pdf;
        } finally {
            await browser.close();
        }
    }

    /**
     * Generate HTML for PDF export
     * @private
     */
    generatePDFHTML(data, options) {
        const { title, headers, columns, summary, charts } = options;

        const rows = data.map(item => {
            const cells = columns.map(col => {
                const value = this.getNestedValue(item, col.key);
                const formatted = col.format ? col.format(value, item) : (value || '-');
                return `<td style="padding: 8px; border: 1px solid #e5e7eb;">${formatted}</td>`;
            }).join('');
            return `<tr style="background-color: ${data.indexOf(item) % 2 === 0 ? 'white' : '#f9fafb'};">${cells}</tr>`;
        }).join('');

        const headerCells = headers.map(h => 
            `<th style="padding: 10px; background-color: #3b82f6; color: white; font-weight: bold; border: 1px solid #2563eb; text-align: left;">${h}</th>`
        ).join('');

        let summaryHTML = '';
        if (summary) {
            summaryHTML = `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                    <h3 style="margin: 0 0 10px 0; color: #374151;">Summary</h3>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        ${Object.entries(summary).map(([key, value]) => `
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${value}</div>
                                <div style="font-size: 12px; color: #6b7280; text-transform: capitalize;">${key}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @page { margin: 20mm; }
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        font-size: 12px;
                        line-height: 1.5;
                        color: #374151;
                    }
                    h1 { 
                        color: #111827; 
                        margin-bottom: 20px;
                        font-size: 24px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 20px;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #e5e7eb;
                    }
                    .date {
                        color: #6b7280;
                        font-size: 12px;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 10px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 10px;
                        color: #9ca3af;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                    <span class="date">Generated: ${new Date().toLocaleString()}</span>
                </div>
                
                ${summaryHTML}
                
                <table>
                    <thead>
                        <tr>${headerCells}</tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                
                <div class="footer">
                    Ticketing System Report - Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Export tickets report
     * @param {Array} tickets - Array of ticket objects
     * @param {string} format - Export format (pdf, excel, csv)
     * @param {Object} options - Additional options
     * @returns {Buffer|string} Exported data
     */
    async exportTickets(tickets, format = 'excel', options = {}) {
        const columns = [
            { key: 'ticketId', width: 15 },
            { key: 'subject', width: 40 },
            { key: 'status', width: 15 },
            { key: 'priority', width: 12 },
            { key: 'departmentId.name', width: 20, fallback: 'department' },
            { key: 'categoryId.name', width: 20, fallback: 'category' },
            { key: 'assignedTo.name', width: 20, fallback: 'assignedToName' },
            { key: 'createdBy.name', width: 20, fallback: 'createdByName' },
            { key: 'createdAt', width: 18, format: (v) => v ? new Date(v).toLocaleDateString() : '-' },
            { key: 'resolvedAt', width: 18, format: (v) => v ? new Date(v).toLocaleDateString() : '-' },
        ];

        const headers = ['Ticket ID', 'Subject', 'Status', 'Priority', 'Department', 'Category', 'Assigned To', 'Created By', 'Created Date', 'Resolved Date'];

        const exportOptions = {
            title: options.title || 'Tickets Report',
            headers,
            columns,
            sheetName: 'Tickets',
            summary: options.summary
        };

        switch (format.toLowerCase()) {
            case 'excel':
            case 'xlsx':
                return await this.exportToExcel(tickets, exportOptions);
            case 'csv':
                return this.exportToCSV(tickets, exportOptions);
            case 'pdf':
                return await this.exportToPDF(tickets, exportOptions);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Export analytics report
     * @param {Object} analyticsData - Analytics data object
     * @param {string} format - Export format
     * @returns {Buffer|string} Exported data
     */
    async exportAnalytics(analyticsData, format = 'excel') {
        const workbook = new ExcelJS.Workbook();
        
        // Summary Sheet
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.addRow(['Analytics Report']).font = { size: 16, bold: true };
        summarySheet.addRow(['Generated:', new Date().toLocaleString()]);
        summarySheet.addRow([]);

        // Add summary metrics
        if (analyticsData.summary) {
            summarySheet.addRow(['Summary Metrics']).font = { bold: true };
            Object.entries(analyticsData.summary).forEach(([key, value]) => {
                summarySheet.addRow([key, value]);
            });
        }

        // Status Distribution Sheet
        if (analyticsData.statusDistribution) {
            const statusSheet = workbook.addWorksheet('Status Distribution');
            statusSheet.addRow(['Status', 'Count']).font = { bold: true };
            analyticsData.statusDistribution.forEach(item => {
                statusSheet.addRow([item.status || item._id, item.count]);
            });
        }

        // Monthly Trend Sheet
        if (analyticsData.monthlyTrend) {
            const trendSheet = workbook.addWorksheet('Monthly Trend');
            trendSheet.addRow(['Month', 'Tickets Created']).font = { bold: true };
            analyticsData.monthlyTrend.forEach(item => {
                trendSheet.addRow([item.month || item._id, item.count]);
            });
        }

        return await workbook.xlsx.writeBuffer();
    }

    /**
     * Get nested object value by path
     * @private
     */
    getNestedValue(obj, path) {
        const keys = path.split('.');
        let value = obj;
        
        for (const key of keys) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[key];
        }
        
        return value;
    }
}

module.exports = new ExportService();
