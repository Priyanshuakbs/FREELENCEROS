const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
  currency: { type: String, default: 'INR' },
  role: { type: String, enum: ['admin', 'user'], default: 'admin' },
  isVerified: { type: Boolean, default: false },
  verificationOTP: { type: String, default: '' },
  verificationOTPExpires: { type: Date },
  resetPasswordToken: { type: String, default: '' },
  resetPasswordExpire: { type: Date },
  monthlyGoal: { type: Number, default: 100000 },
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);