const mongoose = require('mongoose');
const gigSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  skillsRequired: [String],
  budget: { min: Number, max: Number },
  milestones: [{ title: String, amount: Number, dueDate: Date, status: { type: String, enum: ['pending', 'in_progress', 'completed', 'paid'], default: 'pending' } }],
  attachments: [String],
  location: { city: String, state: String, remote: Boolean },
  status: { type: String, enum: ['pending', 'open', 'in_progress', 'completed', 'closed', 'rejected'], default: 'open' },
  invitedFreelancers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });
module.exports = mongoose.model('Gig', gigSchema);

