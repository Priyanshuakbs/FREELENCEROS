const express = require('express');
const router = express.Router();
const { createUpload } = require('../middleware/upload');
const upload = createUpload({ fileSize: 6 * 1024 * 1024 });
const { 
  getClients, 
  createClient, 
  updateClient, 
  deleteClient, 
  addPaymentRecord, 
  sendClientVerificationOTP, 
  uploadClientDocument 
} = require('../controllers/clientController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.use(adminOnly);

router.get('/', getClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.post('/:id/payments', upload.single('screenshot'), addPaymentRecord);
router.post('/:id/send-otp', sendClientVerificationOTP);
router.post('/:id/documents', upload.single('file'), uploadClientDocument);
router.delete('/:id', deleteClient);

module.exports = router;
