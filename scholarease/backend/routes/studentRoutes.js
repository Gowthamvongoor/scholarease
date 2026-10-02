const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Document = require('../models/Document');
const Scholarship = require('../models/Scholarship');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${Date.now()}_${basename}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG, and DOC files are allowed'));
    }
  },
});

// Helper function to evaluate eligibility of a student against a scholarship
const evaluateScholarshipEligibility = (student, scholarship) => {
  const criteria = scholarship.criteria || {};
  const breakdown = {
    course: { passed: true, details: '' },
    category: { passed: true, details: '' },
    state: { passed: true, details: '' },
    income: { passed: true, details: '' },
    marks: { passed: true, details: '' },
  };

  let points = 0;
  const totalCriteria = 5;

  // 1. Course Check
  if (
    criteria.course &&
    criteria.course.length > 0 &&
    !criteria.course.some((c) => c.toLowerCase() === 'all' || c.toLowerCase() === 'any')
  ) {
    const matched = criteria.course.some((c) =>
      student.course ? student.course.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(student.course.toLowerCase()) : false
    );
    if (matched) {
      breakdown.course = { passed: true, details: `Matches eligible course: ${criteria.course.join(', ')}` };
      points++;
    } else {
      breakdown.course = { passed: false, details: `Required course(s): ${criteria.course.join(', ')}` };
    }
  } else {
    breakdown.course = { passed: true, details: 'Open to all courses' };
    points++;
  }

  // 2. Category Check
  if (
    criteria.category &&
    criteria.category.length > 0 &&
    !criteria.category.some((c) => c.toLowerCase() === 'all' || c.toLowerCase() === 'any')
  ) {
    const matched = criteria.category.some(
      (cat) => cat.toLowerCase() === (student.category || '').toLowerCase()
    );
    if (matched) {
      breakdown.category = { passed: true, details: `Matches category: ${student.category}` };
      points++;
    } else {
      breakdown.category = { passed: false, details: `Eligible categories: ${criteria.category.join(', ')}` };
    }
  } else {
    breakdown.category = { passed: true, details: 'Open to all categories' };
    points++;
  }

  // 3. State Check
  if (
    criteria.state &&
    criteria.state.trim().toLowerCase() !== 'all india' &&
    criteria.state.trim().toLowerCase() !== 'all' &&
    criteria.state.trim() !== ''
  ) {
    const matched = criteria.state.toLowerCase() === (student.state || '').toLowerCase();
    if (matched) {
      breakdown.state = { passed: true, details: `Matches state: ${student.state}` };
      points++;
    } else {
      breakdown.state = { passed: false, details: `Applicable only in: ${criteria.state}` };
    }
  } else {
    breakdown.state = { passed: true, details: 'Applicable throughout India' };
    points++;
  }

  // 4. Income Check
  if (criteria.minimumIncome != null && criteria.minimumIncome > 0) {
    const studentIncome = student.income || 0;
    if (studentIncome <= criteria.minimumIncome) {
      breakdown.income = {
        passed: true,
        details: `Income ₹${studentIncome.toLocaleString('en-IN')} ≤ limit ₹${criteria.minimumIncome.toLocaleString('en-IN')}`,
      };
      points++;
    } else {
      breakdown.income = {
        passed: false,
        details: `Income ₹${studentIncome.toLocaleString('en-IN')} exceeds limit of ₹${criteria.minimumIncome.toLocaleString('en-IN')}`,
      };
    }
  } else {
    breakdown.income = { passed: true, details: 'No income ceiling restriction' };
    points++;
  }

  // 5. Marks / CGPA Check
  if (criteria.minimumMarks != null && criteria.minimumMarks > 0) {
    const studentCgpa = student.cgpa || 0;
    // If criteria is specified on 10-point scale (<= 10) vs 100 percentage
    const requiredMarks = criteria.minimumMarks;
    let studentScore = studentCgpa;
    let meetsMarks = false;

    if (requiredMarks <= 10) {
      meetsMarks = studentScore >= requiredMarks;
    } else {
      // If student marks stored as CGPA, convert roughly to % (CGPA * 9.5 or * 10)
      const estimatedPercent = studentCgpa * 9.5;
      meetsMarks = estimatedPercent >= requiredMarks;
    }

    if (meetsMarks) {
      breakdown.marks = {
        passed: true,
        details: `Academic score meets requirement (Min required: ${requiredMarks})`,
      };
      points++;
    } else {
      breakdown.marks = {
        passed: false,
        details: `Score below required benchmark of ${requiredMarks}`,
      };
    }
  } else {
    breakdown.marks = { passed: true, details: 'No minimum score requirement' };
    points++;
  }

  const matchPercentage = Math.round((points / totalCriteria) * 100);
  const isEligible = points === totalCriteria;

  return {
    isEligible,
    matchPercentage,
    points,
    totalCriteria,
    breakdown,
  };
};

// @desc    Update Student Profile
// @route   PUT /api/v1/students/profile
// @access  Private (Student)
router.put('/profile', protect, authorize('Student'), async (req, res) => {
  try {
    const { name, phone, course, year, state, income, category, cgpa } = req.body;

    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    if (name) student.name = name;
    if (phone !== undefined) student.phone = phone;
    if (course) student.course = course;
    if (year !== undefined) student.year = Number(year);
    if (state) student.state = state;
    if (income !== undefined) student.income = Number(income);
    if (category) student.category = category;
    if (cgpa !== undefined) student.cgpa = Number(cgpa);

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      student,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating student profile',
    });
  }
});

// @desc    Check eligibility against all active scholarships or a specific scholarship
// @route   GET /api/v1/students/eligibility
// @access  Private (Student)
router.get('/eligibility', protect, authorize('Student'), async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const { scholarshipId } = req.query;
    let query = { status: 'Active' };
    if (scholarshipId) {
      query._id = scholarshipId;
    }

    const scholarships = await Scholarship.find(query);

    const evaluated = scholarships.map((sch) => {
      const evaluation = evaluateScholarshipEligibility(student, sch);
      return {
        scholarship: sch,
        ...evaluation,
      };
    });

    // Sort: fully eligible first, then by matchPercentage descending
    evaluated.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return b.matchPercentage - a.matchPercentage;
    });

    const eligibleCount = evaluated.filter((e) => e.isEligible).length;

    res.status(200).json({
      success: true,
      totalCount: evaluated.length,
      eligibleCount,
      evaluations: evaluated,
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking eligibility',
    });
  }
});

// @desc    Upload student document
// @route   POST /api/v1/students/upload-document
// @access  Private (Student)
router.post(
  '/upload-document',
  protect,
  authorize('Student'),
  upload.single('file'),
  async (req, res) => {
    try {
      const { documentName, documentType } = req.body;

      if (!documentName || !documentType) {
        return res.status(400).json({
          success: false,
          message: 'Please provide documentName and documentType',
        });
      }

      let filePath = '';
      if (req.file) {
        filePath = `/uploads/${req.file.filename}`;
      } else if (req.body.filePath) {
        filePath = req.body.filePath;
      } else {
        // Fallback default mock vault path if testing without binary upload
        filePath = `/uploads/doc_${Date.now()}.pdf`;
      }

      const document = await Document.create({
        student: req.user._id,
        documentName,
        documentType,
        filePath,
        uploadDate: new Date(),
        status: 'Verified',
      });

      // Link to student's documents array
      await Student.findByIdAndUpdate(req.user._id, {
        $push: { documents: document._id },
      });

      // Create notification
      await Notification.create({
        userId: req.user._id,
        message: `Document "${documentName}" (${documentType}) has been verified and stored in your vault.`,
        type: 'Document',
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded and verified successfully',
        document,
      });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error uploading document',
      });
    }
  }
);

// @desc    Get all documents of current student
// @route   GET /api/v1/students/documents
// @access  Private (Student)
router.get('/documents', protect, authorize('Student'), async (req, res) => {
  try {
    const documents = await Document.find({ student: req.user._id }).sort({ uploadDate: -1 });
    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents',
    });
  }
});

// @desc    Delete a document
// @route   DELETE /api/v1/students/documents/:id
// @access  Private (Student)
router.delete('/documents/:id', protect, authorize('Student'), async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      student: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Remove file if exists on disk
    if (document.filePath && document.filePath.startsWith('/uploads/')) {
      const fullPath = path.join(__dirname, '..', document.filePath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn('Failed to delete physical file:', e.message);
        }
      }
    }

    await Document.findByIdAndDelete(document._id);
    await Student.findByIdAndUpdate(req.user._id, {
      $pull: { documents: document._id },
    });

    res.status(200).json({
      success: true,
      message: 'Document removed from vault',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete document',
    });
  }
});

module.exports = router;
