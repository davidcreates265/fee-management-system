const { MongoClient } = require('mongodb');

// Connect to the MongoDB database
const uri = 'mongodb://localhost:27017/feeManagementSystemDB';
const client = new MongoClient(uri, { useNewUrlParser: true });
const db = client.db();

client.connect((err) => {
  if (err) {
    console.error('Error connecting to MongoDB:', err);
  } else {
    console.log('Connected to MongoDB');
  }
});

// Export the connected database instance
module.exports = db;
