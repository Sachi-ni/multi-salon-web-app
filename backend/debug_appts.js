import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  
  // Find the super-admin
  const Admin = mongoose.model('Admin', new mongoose.Schema({}, { strict: false }));
  const superAdmin = await Admin.findOne({ role: 'super-admin' }).lean();
  
  if (!superAdmin) {
    console.log('No super-admin found!');
    // List all admins
    const allAdmins = await Admin.find({}).select('role full_name email').lean();
    console.log('All admins:', JSON.stringify(allAdmins, null, 2));
  } else {
    console.log('Super admin found:', superAdmin.role, superAdmin.full_name || superAdmin.email);
    
    // Generate a token like the login would
    const token = jwt.sign({ id: superAdmin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Test the API call
    const response = await fetch(`http://localhost:5000/api/appointments?salonId=all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('API status:', response.status);
    const data = await response.json();
    console.log('API response type:', typeof data, Array.isArray(data) ? `array(${data.length})` : '');
    if (Array.isArray(data)) {
      console.log('First appointment:', JSON.stringify(data[0], null, 2).substring(0, 500));
    } else {
      console.log('Response:', JSON.stringify(data).substring(0, 500));
    }
  }
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
