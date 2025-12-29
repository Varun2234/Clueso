import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../config/db.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

(async () => {
  await connectDB();
  const email = 'copilot_e2e@example.com';
  const password = 'password123';
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ fullName: 'Copilot E2E', email, password });
    console.log('Created user', user._id);
  } else {
    console.log('User exists', user._id);
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  console.log('Token:', token);
  process.exit(0);
})();
