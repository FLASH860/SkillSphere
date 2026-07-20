const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStats,
  getUsers,
  toggleSuspend,
  verifyFreelancer,
  getAllGigs,
  getPendingGigs,
  approveGig,
  rejectGig,
  getSettings,
  updateSettings,
} = require('../controllers/adminController');
router.use(protect, authorize('admin'));
router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/toggle-suspend', toggleSuspend);
router.put('/freelancers/:userId/verify', verifyFreelancer);
router.get('/gigs', getAllGigs);
router.get('/gigs/pending', getPendingGigs);
router.put('/gigs/:id/approve', approveGig);
router.put('/gigs/:id/reject', rejectGig);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
module.exports = router;
