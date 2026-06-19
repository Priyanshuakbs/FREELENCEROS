const express = require('express');
const router = express.Router();
const {
  getInvoices,
  createInvoice,
  updateStatus,
  deleteInvoice,
  getInvoice,
  downloadPDF,
  sendReminderEmail
} = require('../controllers/invoiceController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.use(adminOnly);

router.get('/', getInvoices);
router.post('/', createInvoice);
router.get('/:id', getInvoice);
router.put('/:id/status', updateStatus);
router.delete('/:id', deleteInvoice);
router.get('/:id/pdf', downloadPDF);
router.post('/:id/remind', sendReminderEmail);

module.exports = router;