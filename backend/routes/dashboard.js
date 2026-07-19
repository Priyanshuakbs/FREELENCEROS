const express = require('express');
const router = express.Router();
const { createUpload } = require('../middleware/upload');
const upload = createUpload({ fileSize: 10 * 1024 * 1024 });

const { 
  getAdminSummary, 
  getClientSummary, 
  updateClientProfile, 
  createClientInvoiceRazorpayOrder, 
  verifyClientInvoiceRazorpayPayment,
  getClientProjectMessages,
  sendClientProjectMessage,
  clientUploadProjectFile,
  clientDeleteProjectFile
} = require('../controllers/dashboardController');
const { protect, adminOnly, clientProtect } = require('../middleware/auth');

// Admin Dashboard stats
router.get('/admin/summary', protect, adminOnly, getAdminSummary);

// Client Dashboard stats & profile
router.get('/client/summary', clientProtect, getClientSummary);
router.put('/client/profile', clientProtect, updateClientProfile);

// Client Invoice payments
router.post('/client/invoices/:id/razorpay-order', clientProtect, createClientInvoiceRazorpayOrder);
router.post('/client/invoices/:id/razorpay-verify', clientProtect, verifyClientInvoiceRazorpayPayment);

// Client Project interactions (Chat & Files)
router.get('/client/projects/:id/messages', clientProtect, getClientProjectMessages);
router.post('/client/projects/:id/messages', clientProtect, sendClientProjectMessage);
router.post('/client/projects/:id/files', clientProtect, upload.single('file'), clientUploadProjectFile);
router.delete('/client/projects/:id/files/:fileId', clientProtect, clientDeleteProjectFile);

module.exports = router;
