const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createCheckoutSession,
  confirmPayment,
  releaseMilestone,
  getPaymentsForGig,
} = require('../controllers/paymentController');

router.post('/create-checkout-session', protect, authorize('client'), createCheckoutSession);
router.post('/confirm', protect, confirmPayment);
router.post('/release', protect, authorize('client'), releaseMilestone);
router.get('/gig/:gigId', protect, getPaymentsForGig);

module.exports = router;
