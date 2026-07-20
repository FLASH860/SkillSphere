const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  by: { type: String, enum: ['freelancer', 'client'], required: true },
  amount: { type: Number, required: true },
  estimatedDays: { type: Number, required: true },
  message: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const proposalSchema = new mongoose.Schema({
  gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: String,
  bidAmount: Number,
  estimatedDays: Number,
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'negotiating'], default: 'pending' },
  offers: [offerSchema],
}, { timestamps: true });

module.exports = mongoose.model('Proposal', proposalSchema);
