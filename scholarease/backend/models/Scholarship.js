const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema(
  {
    scholarshipId: {
      type: String,
      unique: true,
      default: () => 'SCH-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase(),
    },
    name: {
      type: String,
      required: [true, 'Please provide scholarship name'],
      trim: true,
    },
    provider: {
      type: String,
      required: [true, 'Please provide provider / organization name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide scholarship description'],
    },
    benefits: {
      type: String,
      required: [true, 'Please provide benefits information'],
    },
    deadline: {
      type: Date,
      required: [true, 'Please provide application deadline'],
    },
    applicationLink: {
      type: String,
      required: [true, 'Please provide application link'],
    },
    status: {
      type: String,
      enum: ['Active', 'Closed', 'Upcoming'],
      default: 'Active',
    },
    criteria: {
      course: {
        type: [String],
        default: ['All'],
      },
      category: {
        type: [String],
        default: ['All'],
      },
      state: {
        type: String,
        default: 'All India',
      },
      minimumIncome: {
        type: Number,
        default: 800000,
      },
      minimumMarks: {
        type: Number,
        default: 60, // Minimum percentage (e.g. 60) or CGPA (e.g. 6.0)
      },
      otherRequirements: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);
module.exports = Scholarship;
