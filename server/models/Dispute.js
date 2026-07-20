const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig' },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: String,
  evidenceUrls: [String],
  status: { type: String, enum: ['open', 'reviewing', 'resolved'], default: 'open' },
  resolutionNote: String,
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
