const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig' },
  milestone: String,
  payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  payee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  status: { type: String, enum: ['pending', 'escrow', 'released', 'refunded'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
