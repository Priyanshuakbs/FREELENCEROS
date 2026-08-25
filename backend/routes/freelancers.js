const express = require('express');
const router = express.Router();
const { eitherProtect } = require('../middleware/auth');
const {
  getFreelancersDirectory,
  getPublicFreelancerProfile,
  contactFreelancer,
} = require('../controllers/freelancerController');

// Public route to discover / explore freelancers
router.get('/', getFreelancersDirectory);

// Public route to view freelancer portfolio
router.get('/:identifier/public-profile', getPublicFreelancerProfile);

// Authenticated route to contact freelancer
router.post('/:id/contact', eitherProtect, contactFreelancer);

module.exports = router;
