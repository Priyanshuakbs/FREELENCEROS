const express = require('express');
const router = express.Router();
const { createUpload } = require('../middleware/upload');
const upload = createUpload({ fileSize: 5 * 1024 * 1024 });
const {
  register,
  login,
  getMe,
  updateGoal,
  updateProfile,
  changePassword,
  verifyOTP,
  resendVerification,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/goal', protect, updateGoal);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/password', protect, changePassword);
router.post('/verify-otp', protect, verifyOTP);
router.post('/resend-verify', protect, resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
