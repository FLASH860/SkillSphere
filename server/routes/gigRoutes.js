const router = require('express').Router();
const { createGig, getGigs, getGigById, getMyGigs, updateProgress, getAssignedGigs, updateGig } = require('../controllers/gigController');
const { protect, authorize } = require('../middleware/auth');
router.post('/', protect, authorize('client'), createGig);
router.get('/', protect, getGigs);
router.get('/mine', protect, authorize('client'), getMyGigs);
router.get('/assigned', protect, authorize('freelancer'), getAssignedGigs);
router.get('/:id', protect, getGigById);
router.patch('/:id/progress', protect, authorize('freelancer'), updateProgress);
router.patch('/:id', protect, authorize('client'), updateGig);
module.exports = router;


