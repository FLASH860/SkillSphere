const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'gig_posted',
      'proposal_accepted',
      'proposal_rejected',
      'proposal_countered',
      'proposal_declined',
      'payment_received',
      'review_added',
      'message_received',
      'booking_requested',
      'booking_confirmed',
      'booking_declined',
    ],
  },
  message: String,
  read: { type: Boolean, default: false },
  link: String,
}, { timestamps: true });
module.exports = mongoose.model('Notification', notificationSchema);
