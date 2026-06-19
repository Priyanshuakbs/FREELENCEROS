const express = require('express');
const router = express.Router();
const { generateInvoiceItems, generateContractTerms } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/generate-invoice', protect, generateInvoiceItems);
router.post('/generate-contract', protect, generateContractTerms);

module.exports = router;