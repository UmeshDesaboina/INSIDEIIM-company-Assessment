const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Report = require('./models/Report');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    const count = await Report.countDocuments();
    console.log('Total reports in DB:', count);
    const reports = await Report.find().select('symbol companyName createdAt').limit(10);
    console.log('Sample reports:', reports);
    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
