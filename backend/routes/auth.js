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
  clientLogin,
  getClientMe,
  clientForgotPassword,
  clientResetPassword,
  clientVerifyOTP,
} = require('../controllers/authController');
const { protect, clientProtect } = require('../middleware/auth');

// Freelancer/User routes
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

// Client auth routes
router.post('/client/login', clientLogin);
router.get('/client/me', clientProtect, getClientMe);
router.post('/client/forgot-password', clientForgotPassword);
router.post('/client/reset-password/:token', clientResetPassword);
router.post('/client/verify-otp', clientVerifyOTP);

module.exports = router;
