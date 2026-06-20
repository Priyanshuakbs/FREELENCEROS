const express = require('express');
const router = express.Router();
const {
  getInvoices,
  createInvoice,
  updateStatus,
  deleteInvoice,
  getInvoice,
  downloadPDF,
  sendReminderEmail,
  createFromTimeLogs,
  createRazorpayOrder,
  verifyRazorpayPayment,
  updateRecurring,
} = require('../controllers/invoiceController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.use(adminOnly);

router.get('/', getInvoices);
router.post('/', createInvoice);
router.post('/from-timelogs', createFromTimeLogs);
router.get('/:id', getInvoice);
router.put('/:id/status', updateStatus);
router.patch('/:id/status', updateStatus);
router.put('/:id/recurring', updateRecurring);
router.delete('/:id', deleteInvoice);
router.get('/:id/pdf', downloadPDF);
router.post('/:id/remind', sendReminderEmail);
router.post('/:id/razorpay-order', createRazorpayOrder);
router.post('/:id/razorpay-verify', verifyRazorpayPayment);

module.exports = router;