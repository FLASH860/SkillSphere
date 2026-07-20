const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
  day: { type: String, required: true },
  slot: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending' },
  message: String,
}, { timestamps: true });

bookingSchema.index({ freelancer: 1, day: 1, slot: 1, gig: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
