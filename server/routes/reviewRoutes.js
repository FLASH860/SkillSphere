const router = require('express').Router();
const { createReview, getReviewsForUser, getReviewsForGig, getReviewAnalytics } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
router.post('/', protect, createReview);
router.get('/user/:userId', getReviewsForUser);
router.get('/analytics/:userId', getReviewAnalytics);
router.get('/gig/:gigId', protect, getReviewsForGig);
module.exports = router;
