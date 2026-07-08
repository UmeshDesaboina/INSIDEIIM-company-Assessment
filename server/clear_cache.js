const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function clearCache() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully.');

    // Delete all records in reports collection
    const reportCount = await mongoose.connection.collection('reports').countDocuments();
    console.log(`Current reports in database: ${reportCount}`);
    
    if (reportCount > 0) {
      const deleteResult = await mongoose.connection.collection('reports').deleteMany({});
      console.log(`Deleted ${deleteResult.deletedCount} reports.`);
    }

    console.log('Database cache cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database cache:', error);
    process.exit(1);
  }
}

clearCache();
