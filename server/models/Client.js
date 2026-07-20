const mongoose = require('mongoose');
const clientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: String,
  bio: String,
  hourlyRate: Number,
  skills: [{ name: String, level: { type: String, enum: ['beginner', 'intermediate', 'expert'] } }],
  availability: [{ day: String, slots: [String] }],
  experience: [{ title: String, company: String, from: String, to: String, description: String }],
  portfolio: [{ title: String, imageUrl: String, link: String }],
  resumeUrl: String,
  certifications: [{ name: String, issuer: String, year: Number }],
  totalSpent: { type: Number, default: 0 },
  gigsPosted: { type: Number, default: 0 },
  ratingAvg: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('Client', clientSchema);



