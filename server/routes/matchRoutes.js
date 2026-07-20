const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getRecommendedFreelancers } = require('../controllers/matchController');

router.get('/gig/:gigId', protect, getRecommendedFreelancers);

module.exports = router;
