const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['client', 'freelancer', 'admin'], default: 'client' },
  avatar: { type: String, default: '' },
  location: {
    city: String, state: String, country: String,
    coordinates: { lat: Number, lng: Number }
  },
  isVerified: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  twoFactorSecret: { type: String, select: false },
  twoFactorEnabled: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  bio: String,
  hourlyRate: Number,
  skills: [{ name: String, level: { type: String, enum: ['beginner', 'intermediate', 'expert'] } }],
  availability: [{ day: String, slots: [String] }],
  experience: [{ title: String, company: String, from: String, to: String, description: String }],
  portfolio: [{ title: String, imageUrl: String, link: String }],
  resumeUrl: String,
  certifications: [{ name: String, issuer: String, year: Number }],
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
