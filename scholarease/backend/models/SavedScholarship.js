const mongoose = require('mongoose');

const savedScholarshipSchema = new mongoose.Schema({
  saveId: {
    type: String,
    unique: true,
    default: () => 'SAVE-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase(),
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scholarship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true,
  },
  savedDate: {
    type: Date,
    default: Date.now,
  },
});

// Avoid duplicate saves for the same student and scholarship
savedScholarshipSchema.index({ student: 1, scholarship: 1 }, { unique: true });

const SavedScholarship = mongoose.model('SavedScholarship', savedScholarshipSchema);
module.exports = SavedScholarship;
