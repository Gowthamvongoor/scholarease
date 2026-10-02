const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  documentId: {
    type: String,
    unique: true,
    default: () => 'DOC-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase(),
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documentName: {
    type: String,
    required: [true, 'Please provide a document name'],
    trim: true,
  },
  documentType: {
    type: String,
    required: [true, 'Please provide a document type'],
    enum: [
      'Income Certificate',
      'Caste Certificate',
      'Marksheet / Transcript',
      'Identity Proof (Aadhaar/PAN)',
      'Domicile Certificate',
      'College Bonafide / ID',
      'Fee Receipt',
      'Other',
    ],
    default: 'Other',
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Verified',
  },
});

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
