const mongoose = require('mongoose');
const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  manualGigApprovalEnabled: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('Settings', settingsSchema);
