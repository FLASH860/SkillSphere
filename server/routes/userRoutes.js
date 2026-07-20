const router = require('express').Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/:id', protect, getProfile);
router.put('/me', protect, updateProfile);

module.exports = router;
