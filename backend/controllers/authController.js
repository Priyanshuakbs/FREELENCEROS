const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailUtil');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE,
});

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || '',
  bio: user.bio || '',
  title: user.title || '',
  company: user.company || '',
  phone: user.phone || '',
  location: user.location || '',
  website: user.website || '',
  linkedin: user.linkedin || '',
  github: user.github || '',
  portfolio: user.portfolio || '',
  plan: user.plan,
  monthlyGoal: user.monthlyGoal,
  isVerified: user.isVerified,
  role: user.role,
});

exports.register = async (req, res) => {
  console.log('Register hit:', req.body);
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    // Password complexity check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long, and contain one uppercase, one lowercase, one digit, and one special character.'
      });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationOTPExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    const user = await User.create({ name, email, password, verificationOTP, verificationOTPExpires });

    // Send verification email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf5ff;">
        <h2 style="color: #6366f1; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px; margin-top: 0;">Welcome to FreelanceOS! 💼</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for creating an account on FreelanceOS. To secure your account and access your dashboard, please verify your email address by entering the verification code (OTP) below:</p>
        <div style="margin: 25px 0; text-align: center;">
          <span style="background-color: #6366f1; color: white; padding: 12px 30px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; display: inline-block;">${verificationOTP}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">Enter this 6-digit code on the verification screen to activate your account.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">This code is valid for 15 minutes. If you did not sign up for FreelanceOS, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: '📧 Verify Your Email - FreelanceOS',
        html: htmlContent,
        text: `Welcome to FreelanceOS! Your email verification code is: ${verificationOTP}`
      });
    } catch (mailErr) {
      console.error('Failed to send verification email during registration:', mailErr.message);
    }

    res.status(201).json({
      token: generateToken(user._id),
      user: serializeUser(user)
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      token: generateToken(user._id),
      user: serializeUser(user)
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { monthlyGoal } = req.body;
    if (monthlyGoal === undefined || Number(monthlyGoal) <= 0) {
      return res.status(400).json({ message: 'Valid monthly goal required.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { monthlyGoal: Number(monthlyGoal) },
      { new: true }
    ).select('-password');

    res.json({ user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = {
      name: req.body.name?.trim(),
      title: req.body.title?.trim() || '',
      company: req.body.company?.trim() || '',
      bio: req.body.bio?.trim() || '',
      phone: req.body.phone?.trim() || '',
      location: req.body.location?.trim() || '',
      website: req.body.website?.trim() || '',
      linkedin: req.body.linkedin?.trim() || '',
      github: req.body.github?.trim() || '',
      portfolio: req.body.portfolio?.trim() || '',
    };

    if (!updates.name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    if (req.file) {
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select('-password');

    res.json({ user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const matches = await user.matchPassword(currentPassword);
    if (!matches) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Your email address is already verified.' });
    }

    if (user.verificationOTP !== otp || user.verificationOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired verification OTP.' });
    }

    user.isVerified = true;
    user.verificationOTP = '';
    user.verificationOTPExpires = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully!',
      user: serializeUser(user)
    });
  } catch (err) {
    console.error('Verification error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) {
      return res.status(400).json({ message: 'Your email address is already verified.' });
    }

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = verificationOTP;
    user.verificationOTPExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf5ff;">
        <h2 style="color: #6366f1; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px; margin-top: 0;">Verify Your Email Address 💼</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>We received a request to resend the email verification OTP. Enter the verification code below to verify your email address:</p>
        <div style="margin: 25px 0; text-align: center;">
          <span style="background-color: #6366f1; color: white; padding: 12px 30px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; display: inline-block;">${verificationOTP}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">Enter this 6-digit code on the verification screen to activate your account.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">This code is valid for 15 minutes. If you did not make this request, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: '📧 Resend: Verify Your Email - FreelanceOS',
      html: htmlContent,
      text: `Verify your email address using this code: ${verificationOTP}`
    });

    res.json({ message: 'Verification OTP sent successfully!' });
  } catch (err) {
    console.error('Resend error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email address.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fffaf0;">
        <h2 style="color: #f59e0b; border-bottom: 2px solid #fef3c7; padding-bottom: 10px; margin-top: 0;">Reset Your Password 🔒</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>You are receiving this email because you (or someone else) requested a password reset for your FreelanceOS account.</p>
        <p>Please click the button below to set a new password:</p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="${resetLink}" style="background-color: #f59e0b; color: white; padding: 12px 30px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.4); display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser:</p>
        <p style="font-size: 12px; background-color: #f1f5f9; padding: 10px; border-radius: 6px; word-break: break-all; font-family: monospace;">${resetLink}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">This link is valid for 1 hour. If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: '🔒 Reset Password Request - FreelanceOS',
      html: htmlContent,
      text: `Reset your FreelanceOS password here: ${resetLink}`
    });

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // Set new password (will be pre-save hashed)
    user.password = password;
    user.resetPasswordToken = '';
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: err.message });
  }
};
