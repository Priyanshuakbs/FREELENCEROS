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
  phone: { type: String, default: '' },
  company: { type: String, default: '' },
  address: { type: String, default: '' },
  notes: { type: String, default: '' },
  tags: [{ type: String, trim: true }],
  totalProjectAmount: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  payments: [paymentRecordSchema],
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
