const mongoose = require('mongoose');
const freelancerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills: [{ name: String, level: { type: String, enum: ['beginner', 'intermediate', 'expert'] } }],
  bio: String,
  portfolio: [{ title: String, imageUrl: String, link: String }],
  resumeUrl: String,
  certifications: [{ name: String, issuer: String, year: Number }],
  experience: [{ title: String, company: String, from: Date, to: Date, description: String }],
  hourlyRate: Number,
  reputationScore: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  availability: [{ day: String, slots: [String] }],
  verificationBadge: { type: Boolean, default: false },
  profileViews: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('Freelancer', freelancerSchema);
