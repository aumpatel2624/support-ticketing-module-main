require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const cats = await Category.find({});
        cats.forEach(c => {
            console.log(`Category: ${c.name} | SLA: ${c.defaultSLA} (hours/minutes)`);
        });
        mongoose.disconnect();
    })
    .catch(console.error);
