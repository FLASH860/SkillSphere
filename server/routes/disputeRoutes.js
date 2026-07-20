const router = require('express').Router();
const { createDispute, getMyDisputes, getAllDisputes, updateDisputeStatus } = require('../controllers/disputeController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createDispute);
router.get('/mine', protect, getMyDisputes);
router.get('/', protect, authorize('admin'), getAllDisputes);
router.patch('/:id', protect, authorize('admin'), updateDisputeStatus);

module.exports = router;
