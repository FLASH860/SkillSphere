const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  targetType: String,
  targetId: mongoose.Schema.Types.ObjectId,
  details: String,
}, { timestamps: true });

module.exports = mongoose.model('AdminLog', adminLogSchema);
