const router = require('express').Router();
const {
  createProposal,
  getProposalsForGig,
  getMyProposals,
  updateProposalStatus,
  counterProposal,
  respondToOffer,
} = require('../controllers/proposalController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('freelancer'), createProposal);
router.get('/mine', protect, authorize('freelancer'), getMyProposals);
router.get('/gig/:gigId', protect, authorize('client'), getProposalsForGig);
router.put('/:id/status', protect, authorize('client'), updateProposalStatus);
router.post('/:id/counter', protect, authorize('client'), counterProposal);
router.post('/:id/respond', protect, authorize('freelancer'), respondToOffer);

module.exports = router;
