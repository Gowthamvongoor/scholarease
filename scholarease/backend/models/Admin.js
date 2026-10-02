const mongoose = require('mongoose');
const User = require('./User');

const adminSchema = new mongoose.Schema({
  adminId: {
    type: String,
    default: () => 'ADM-' + Math.floor(1000 + Math.random() * 9000),
  },
});

const Admin = User.discriminator('Admin', adminSchema);

module.exports = Admin;
