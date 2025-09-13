import dbConnect from './app/lib/dbConnect.js';

async function testConnection() {
  try {
    await dbConnect();
    console.log("Test completed. Check the log above for 'MongoDB connected successfully'.");
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();