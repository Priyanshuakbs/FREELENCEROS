const express = require('express');
const router = express.Router();
const { createUpload } = require('../middleware/upload');
const upload = createUpload({ fileSize: 10 * 1024 * 1024 });

const { 
  getProjects, 
  createProject, 
  updateProject, 
  deleteProject, 
  addTask, 
  toggleTask,
  moveTask,
  deleteTask,
  getProject,
  generateShareToken,
  getPublicProject,
  inviteCollaborator,
  acceptInvitation,
  removeCollaborator,
  getPendingInvitations,
  cancelInvitation,
  getMyPendingInvitations,
  rejectInvitation,
  getMessages,
  sendMessage,
  uploadFile,
  deleteFile
} = require('../controllers/projectController');
const { 
  getPublicInvoicePDF,
  createPublicInvoiceRazorpayOrder,
  verifyPublicInvoiceRazorpayPayment
} = require('../controllers/invoiceController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes bypass authentication middleware
router.get('/portal/:token', getPublicProject);
router.get('/portal/:token/invoices/:invoiceId/pdf', getPublicInvoicePDF);
router.post('/portal/:token/invoices/:invoiceId/razorpay-order', createPublicInvoiceRazorpayOrder);
router.post('/portal/:token/invoices/:invoiceId/razorpay-verify', verifyPublicInvoiceRazorpayPayment);

router.use(protect);
router.get('/invitations/pending', getMyPendingInvitations);
router.post('/invite/reject/:token', rejectInvitation);
router.get('/', getProjects);
router.post('/', adminOnly, createProject);
router.get('/:id', getProject);
router.put('/:id', adminOnly, updateProject);
router.delete('/:id', adminOnly, deleteProject);
router.post('/:id/tasks', addTask);
router.patch('/:id/tasks/:taskId', toggleTask);
router.patch('/:id/tasks/:taskId/move', moveTask);
router.delete('/:id/tasks/:taskId', deleteTask);
router.post('/:id/share', adminOnly, generateShareToken);
router.post('/:id/invite', adminOnly, inviteCollaborator);
router.post('/invite/accept/:token', acceptInvitation);
router.delete('/:id/collaborators/:userId', adminOnly, removeCollaborator);
router.get('/:id/invitations', adminOnly, getPendingInvitations);
router.delete('/:id/invitations/:inviteId', adminOnly, cancelInvitation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.post('/:id/files', upload.single('file'), uploadFile);
router.delete('/:id/files/:fileId', deleteFile);

module.exports = router;
