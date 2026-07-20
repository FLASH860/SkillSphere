const router = require('express').Router();
const {
  createBooking,
  getMyBookings,
  getBookingsForGig,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('client'), createBooking);
router.get('/mine', protect, authorize('freelancer'), getMyBookings);
router.get('/gig/:gigId', protect, getBookingsForGig);
router.put('/:id/status', protect, authorize('freelancer'), updateBookingStatus);

module.exports = router;
