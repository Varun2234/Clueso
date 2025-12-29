import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const registerUser = async (req, res) => {
  console.log('DEBUG registerUser body:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { fullName, email, password } = req.body;

  try {
    console.log('DEBUG registerUser: checking existing user for', email);
    const userExists = await User.findOne({ email });
    console.log('DEBUG registerUser: userExists ->', !!userExists);
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    console.log('DEBUG registerUser: creating user');
    const user = await User.create({ fullName, email, password });
    console.log('DEBUG registerUser: create success', user._id);

    res.status(201).json({
      user: { id: user._id, fullName: user.fullName, email: user.email },
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json({
        user: { id: user._id, fullName: user.fullName, email: user.email },
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  // req.user is attached by the protect middleware
  res.json(req.user);
};