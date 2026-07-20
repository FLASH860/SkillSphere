const router = require('express').Router();
const { getClientStats, getFreelancerStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/client', protect, authorize('client'), getClientStats);
router.get('/freelancer', protect, authorize('freelancer'), getFreelancerStats);

module.exports = router;
