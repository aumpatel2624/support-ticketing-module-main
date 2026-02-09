const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function generateSample() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Support Ticketing System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Users');

    // Define columns
    worksheet.columns = [
        { header: 'employeeId', key: 'employeeId', width: 15 },
        { header: 'name', key: 'name', width: 25 },
        { header: 'email', key: 'email', width: 30 },
        { header: 'password', key: 'password', width: 20 },
        { header: 'role', key: 'role', width: 15 },
        { header: 'department', key: 'department', width: 20 },
        { header: 'shift', key: 'shift', width: 10 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Add example rows
    worksheet.addRow({
        employeeId: 'EMP001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'NormalUser',
        department: 'IT',
        shift: 'UK'
    });

    worksheet.addRow({
        employeeId: 'EMP002',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'password123',
        role: 'TeamMember',
        department: 'HR',
        shift: 'US'
    });

    // Add notes/comments
    worksheet.getCell('E1').note = 'Valid roles: SuperAdmin, Admin, TeamMember, NormalUser';
    worksheet.getCell('G1').note = 'Valid shifts: US, UK';

    const outputPath = path.join(__dirname, '../../sample_users.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log(`Sample file generated at: ${outputPath}`);
}

generateSample().catch(console.error);
