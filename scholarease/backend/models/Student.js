const mongoose = require('mongoose');
const User = require('./User');

const studentSchema = new mongoose.Schema({
  course: {
    type: String,
    default: 'B.Tech Computer Science',
    trim: true,
  },
  year: {
    type: Number,
    default: 1,
    min: 1,
    max: 6,
  },
  state: {
    type: String,
    default: 'Maharashtra',
    trim: true,
  },
  income: {
    type: Number,
    default: 250000,
    min: 0,
  },
  category: {
    type: String,
    default: 'General',
    enum: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'],
  },
  cgpa: {
    type: Number,
    default: 8.0,
    min: 0,
    max: 10,
  },
  documents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
  ],
  notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
    },
  ],
  savedScholarships: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavedScholarship',
    },
  ],
});

const Student = User.discriminator('Student', studentSchema);

module.exports = Student;
