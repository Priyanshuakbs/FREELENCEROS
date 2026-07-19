const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  note: { type: String, default: '' },
  screenshot: { type: String, default: '' },
  invoiceNumber: { type: String, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true },
  password: { type: String },
  allowLogin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verificationOTP: { type: String, default: '' },
  verificationOTPExpires: { type: Date },
  resetPasswordToken: { type: String, default: '' },
  resetPasswordExpire: { type: Date },
  phone: { type: String, default: '' },
  company: { type: String, default: '' },
  address: { type: String, default: '' },
  notes: { type: String, default: '' },
  tags: [{ type: String, trim: true }],
  gstNumber: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  documents: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  isArchived: { type: Boolean, default: false },
  totalProjectAmount: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  payments: [paymentRecordSchema],
}, { timestamps: true });

const bcrypt = require('bcryptjs');

clientSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

clientSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Client', clientSchema);
