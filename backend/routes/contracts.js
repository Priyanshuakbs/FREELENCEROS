const express = require('express');
const router = express.Router();
const { getContracts, createContract, deleteContract, downloadContractPDF } = require('../controllers/contractController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.use(adminOnly);
router.get('/', getContracts);
router.post('/', createContract);
router.delete('/:id', deleteContract);
router.get('/:id/pdf', downloadContractPDF);

module.exports = router;
