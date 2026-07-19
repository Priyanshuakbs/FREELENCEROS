const express = require('express');
const router = express.Router();
const { getPRD, createOrUpdatePRD, acceptPRD } = require('../controllers/prdController');
const { protect, adminOnly, clientProtect, eitherProtect } = require('../middleware/auth');

router.get('/:id/prd', eitherProtect, getPRD);
router.post('/:id/prd', protect, adminOnly, createOrUpdatePRD);
router.post('/:id/prd/accept', clientProtect, acceptPRD);

module.exports = router;
