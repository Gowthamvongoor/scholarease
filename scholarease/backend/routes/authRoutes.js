const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const { protect, generateToken } = require('../middleware/auth');

// @desc    Register a new user (Student or Admin)
// @route   POST /api/v1/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = 'Student',
      course,
      year,
      state,
      income,
      category,
      cgpa,
      adminSecret,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    let newUser;
    if (role === 'Admin') {
      newUser = await Admin.create({
        name,
        email: email.toLowerCase(),
        password,
        phone: phone || '',
        role: 'Admin',
      });
    } else {
      newUser = await Student.create({
        name,
        email: email.toLowerCase(),
        password,
        phone: phone || '',
        role: 'Student',
        course: course || 'B.Tech Computer Science',
        year: year ? Number(year) : 1,
        state: state || 'Maharashtra',
        income: income ? Number(income) : 250000,
        category: category || 'General',
        cgpa: cgpa ? Number(cgpa) : 8.0,
      });

      // Create welcome notification
      await Notification.create({
        userId: newUser._id,
        message: `Welcome to ScholarEase, ${newUser.name}! Start exploring eligible scholarships today.`,
        type: 'System',
      });
    }

    const token = generateToken(newUser._id, newUser.role);

    // Return user without password
    const userResponse = await User.findById(newUser._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
});

// @desc    Login user & get token
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);
    const userResponse = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('documents')
      .populate({
        path: 'savedScholarships',
        populate: { path: 'scholarship' },
      });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Fetch /me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user details',
    });
  }
});

module.exports = router;
