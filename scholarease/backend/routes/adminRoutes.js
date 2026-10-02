const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Scholarship = require('../models/Scholarship');
const SavedScholarship = require('../models/SavedScholarship');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and Admin role
router.use(protect, authorize('Admin'));

// ==========================================
// 1. REPORT METRICS
// ==========================================
// @desc    Get dashboard report metrics
// @route   GET /api/v1/admins/metrics
// @access  Private (Admin)
router.get('/metrics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalAdmins = await User.countDocuments({ role: 'Admin' });

    const totalScholarships = await Scholarship.countDocuments();
    const activeScholarships = await Scholarship.countDocuments({ status: 'Active' });
    const upcomingScholarships = await Scholarship.countDocuments({ status: 'Upcoming' });
    const closedScholarships = await Scholarship.countDocuments({ status: 'Closed' });

    const totalSavedScholarships = await SavedScholarship.countDocuments();
    const totalDocuments = await Document.countDocuments();

    // Category distribution of students
    const categoryAgg = await Student.aggregate([
      { $match: { role: 'Student' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const categoryDistribution = categoryAgg.map((item) => ({
      category: item._id || 'Unassigned',
      count: item.count,
    }));

    // State distribution of students
    const stateAgg = await Student.aggregate([
      { $match: { role: 'Student' } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const stateDistribution = stateAgg.map((item) => ({
      state: item._id || 'Unknown',
      count: item.count,
    }));

    // Most saved scholarships
    const popularScholarshipsAgg = await SavedScholarship.aggregate([
      { $group: { _id: '$scholarship', saveCount: { $sum: 1 } } },
      { $sort: { saveCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'scholarships',
          localField: '_id',
          foreignField: '_id',
          as: 'scholarshipDetails',
        },
      },
      { $unwind: '$scholarshipDetails' },
      {
        $project: {
          _id: 1,
          saveCount: 1,
          name: '$scholarshipDetails.name',
          provider: '$scholarshipDetails.provider',
          benefits: '$scholarshipDetails.benefits',
        },
      },
    ]);

    // Recent registered users
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        totalStudents,
        totalAdmins,
        scholarships: {
          total: totalScholarships,
          active: activeScholarships,
          upcoming: upcomingScholarships,
          closed: closedScholarships,
        },
        totalSavedScholarships,
        totalDocuments,
        categoryDistribution,
        stateDistribution,
        popularScholarships: popularScholarshipsAgg,
        recentUsers,
      },
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin metrics',
    });
  }
});

// ==========================================
// 2. MANAGE USERS
// ==========================================
// @desc    List all users with pagination and search
// @route   GET /api/v1/admins/users
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role && role !== 'All') {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/v1/admins/users/:id
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Do not allow deleting oneself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own administrative account',
      });
    }

    // Clean up dependent documents, saved scholarships, notifications
    await Document.deleteMany({ student: user._id });
    await SavedScholarship.deleteMany({ student: user._id });
    await Notification.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: `User '${user.name}' and all associated records deleted successfully`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user',
    });
  }
});

// ==========================================
// 3. SCHOLARSHIP CRUD
// ==========================================
// @desc    Create new scholarship
// @route   POST /api/v1/admins/scholarships
// @access  Private (Admin)
router.post('/scholarships', async (req, res) => {
  try {
    const {
      name,
      provider,
      description,
      benefits,
      deadline,
      applicationLink,
      status = 'Active',
      criteria,
    } = req.body;

    if (!name || !provider || !description || !benefits || !deadline || !applicationLink) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required scholarship fields',
      });
    }

    const scholarship = await Scholarship.create({
      name,
      provider,
      description,
      benefits,
      deadline,
      applicationLink,
      status,
      criteria: {
        course: criteria?.course || ['All'],
        category: criteria?.category || ['All'],
        state: criteria?.state || 'All India',
        minimumIncome: criteria?.minimumIncome != null ? Number(criteria.minimumIncome) : 800000,
        minimumMarks: criteria?.minimumMarks != null ? Number(criteria.minimumMarks) : 60,
        otherRequirements: criteria?.otherRequirements || '',
      },
    });

    // Notify all students about the new scholarship
    const students = await User.find({ role: 'Student' }).select('_id');
    const notifications = students.map((s) => ({
      userId: s._id,
      message: `New Scholarship Added: "${scholarship.name}" by ${scholarship.provider}. Check your eligibility now!`,
      type: 'Scholarship',
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: 'Scholarship created successfully',
      scholarship,
    });
  } catch (error) {
    console.error('Create scholarship error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create scholarship',
    });
  }
});

// @desc    Update scholarship
// @route   PUT /api/v1/admins/scholarships/:id
// @access  Private (Admin)
router.put('/scholarships/:id', async (req, res) => {
  try {
    let scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found' });
    }

    scholarship = await Scholarship.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Scholarship updated successfully',
      scholarship,
    });
  } catch (error) {
    console.error('Update scholarship error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update scholarship',
    });
  }
});

// @desc    Delete scholarship
// @route   DELETE /api/v1/admins/scholarships/:id
// @access  Private (Admin)
router.delete('/scholarships/:id', async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found' });
    }

    // Remove any student saves
    await SavedScholarship.deleteMany({ scholarship: scholarship._id });
    await Scholarship.findByIdAndDelete(scholarship._id);

    res.status(200).json({
      success: true,
      message: 'Scholarship deleted successfully',
    });
  } catch (error) {
    console.error('Delete scholarship error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete scholarship',
    });
  }
});

module.exports = router;
