const express = require('express');
const router = express.Router();
const Scholarship = require('../models/Scholarship');
const SavedScholarship = require('../models/SavedScholarship');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// @desc    List, search, and filter scholarships
// @route   GET /api/v1/scholarships
// @access  Public (Optional auth for checking saved status)
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      state,
      course,
      status,
      maxIncome,
      sort = 'deadline_asc',
    } = req.query;

    const filter = {};

    // Status filter (defaults to all if not specified, or Active)
    if (status && status !== 'All') {
      filter.status = status;
    }

    // Search query
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { provider: regex },
        { description: regex },
        { 'criteria.otherRequirements': regex },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      filter.$or = [
        ...(filter.$or || []),
        { 'criteria.category': { $in: [category, 'All'] } },
      ];
    }

    // State filter
    if (state && state !== 'All') {
      filter.$or = [
        ...(filter.$or || []),
        { 'criteria.state': { $in: [state, 'All India', 'All'] } },
      ];
    }

    // Course filter
    if (course && course !== 'All') {
      filter.$or = [
        ...(filter.$or || []),
        { 'criteria.course': { $in: [course, 'All'] } },
      ];
    }

    // Income threshold filter: find scholarships with income ceiling >= student income
    if (maxIncome) {
      filter['criteria.minimumIncome'] = { $gte: Number(maxIncome) };
    }

    // Sort options
    let sortObj = { deadline: 1 }; // default: closest deadline first
    if (sort === 'deadline_desc') {
      sortObj = { deadline: -1 };
    } else if (sort === 'name_asc') {
      sortObj = { name: 1 };
    } else if (sort === 'newest') {
      sortObj = { createdAt: -1 };
    }

    const scholarships = await Scholarship.find(filter).sort(sortObj);

    res.status(200).json({
      success: true,
      count: scholarships.length,
      scholarships,
    });
  } catch (error) {
    console.error('List scholarships error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve scholarships',
    });
  }
});

// @desc    Get all saved scholarships for current logged-in student
// @route   GET /api/v1/scholarships/saved/all
// @access  Private (Student)
router.get('/saved/all', protect, authorize('Student'), async (req, res) => {
  try {
    const saved = await SavedScholarship.find({ student: req.user._id })
      .populate('scholarship')
      .sort({ savedDate: -1 });

    res.status(200).json({
      success: true,
      count: saved.length,
      savedScholarships: saved,
    });
  } catch (error) {
    console.error('Get saved scholarships error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve saved scholarships',
    });
  }
});

// @desc    Get single scholarship details
// @route   GET /api/v1/scholarships/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found' });
    }

    res.status(200).json({
      success: true,
      scholarship,
    });
  } catch (error) {
    console.error('Get single scholarship error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scholarship details',
    });
  }
});

// @desc    Save scholarship for current student
// @route   POST /api/v1/scholarships/:id/save
// @access  Private (Student)
router.post('/:id/save', protect, authorize('Student'), async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found' });
    }

    const existingSave = await SavedScholarship.findOne({
      student: req.user._id,
      scholarship: scholarship._id,
    });

    if (existingSave) {
      return res.status(400).json({
        success: false,
        message: 'Scholarship is already saved',
        savedScholarship: existingSave,
      });
    }

    const savedRecord = await SavedScholarship.create({
      student: req.user._id,
      scholarship: scholarship._id,
    });

    await Student.findByIdAndUpdate(req.user._id, {
      $push: { savedScholarships: savedRecord._id },
    });

    await Notification.create({
      userId: req.user._id,
      message: `You bookmarked "${scholarship.name}". Remember to submit before ${new Date(
        scholarship.deadline
      ).toLocaleDateString()}.`,
      type: 'Scholarship',
    });

    res.status(201).json({
      success: true,
      message: 'Scholarship saved to your vault',
      savedScholarship: savedRecord,
    });
  } catch (error) {
    console.error('Save scholarship error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save scholarship',
    });
  }
});

// @desc    Unsave scholarship
// @route   DELETE /api/v1/scholarships/:id/save
// @access  Private (Student)
router.delete('/:id/save', protect, authorize('Student'), async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found' });
    }

    const savedRecord = await SavedScholarship.findOne({
      student: req.user._id,
      scholarship: scholarship._id,
    });

    if (!savedRecord) {
      return res.status(400).json({
        success: false,
        message: 'Scholarship was not saved',
      });
    }

    await SavedScholarship.findByIdAndDelete(savedRecord._id);

    await Student.findByIdAndUpdate(req.user._id, {
      $pull: { savedScholarships: savedRecord._id },
    });

    res.status(200).json({
      success: true,
      message: 'Scholarship removed from saved list',
    });
  } catch (error) {
    console.error('Unsave scholarship error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to unsave scholarship',
    });
  }
});

module.exports = router;
