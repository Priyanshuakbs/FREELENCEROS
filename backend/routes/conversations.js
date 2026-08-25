const express = require('express');
const router = express.Router();
const { eitherProtect } = require('../middleware/auth');
const {
  getConversations,
  getConversation,
  createOrGetConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} = require('../controllers/conversationController');

// All conversation routes support both User (Freelancer) and Client authentication
router.use(eitherProtect);

router.get('/unread-count', getUnreadCount);
router.get('/', getConversations);
router.post('/', createOrGetConversation);
router.get('/:id', getConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.patch('/:id/read', markAsRead);

module.exports = router;
