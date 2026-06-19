const express = require('express');
const router = express.Router();
const { processChat } = require('../controllers/chatbotController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, adminOnly, processChat);

module.exports = router;
