const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');
const Department = require('../models/Department');
const User = require('../models/User');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check/Create Department
        let dept = await Department.findOne({ name: 'General' });
        if (!dept) {
            dept = await Department.create({
                name: 'General',
                code: 'GEN',
                description: 'General Department',
                isActive: true
            });
            console.log('Created General Department');
        } else {
            console.log('Found General Department');
        }

        // Check/Create Category
        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            await Category.create({
                name: 'General Inquiry',
                description: 'General questions',
                departmentId: dept._id,
                defaultPriority: 'Medium',
                defaultSLA: 48,
                isActive: true,
                createdBy: (await User.findOne({ role: 'SuperAdmin' }))?._id || new mongoose.Types.ObjectId()
            });
            console.log('Created General Inquiry Category');
        } else {
            console.log(`Found ${catCount} Categories`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

seedData();
