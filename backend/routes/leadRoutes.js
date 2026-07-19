const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const validateLead = require('../middleware/validateLead');
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
  addLeadNote,
  convertLeadToClient,
  acceptProposal,
} = require('../controllers/leadController');

router.get('/accept-proposal/:token', acceptProposal);

router.use(protect);

// CRUD
router.get('/', getLeads);
router.post('/', validateLead, createLead);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

// Status patch
router.patch('/:id/status', updateLeadStatus);

// Notes
router.post('/:id/notes', addLeadNote);

// Convert
router.post('/:id/convert', convertLeadToClient);

module.exports = router;