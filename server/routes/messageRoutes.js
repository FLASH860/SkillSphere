const router = require('express').Router();
const { getMessages, getConversations } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/conversations', protect, getConversations);
router.get('/:conversationId', protect, getMessages);

module.exports = router;
