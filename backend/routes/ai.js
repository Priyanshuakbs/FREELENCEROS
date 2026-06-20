const express = require('express');
const router = express.Router();
const { 
  generateInvoiceItems, 
  generateContractTerms,
  generateProposal,
  createPaymentOrder,
  verifyPayment,
} = require('../controllers/aiController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/generate-invoice', protect, generateInvoiceItems);
router.post('/generate-contract', protect, generateContractTerms);
router.post('/proposal', protect, adminOnly, generateProposal);
router.post('/payment/order/:id', protect, adminOnly, createPaymentOrder);
router.post('/payment/verify', protect, verifyPayment);

module.exports = router;