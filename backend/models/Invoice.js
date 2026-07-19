const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [itemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 18 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
  dueDate: { type: Date },
  notes: { type: String, default: '' },
  paidAt: { type: Date },
  // Recurring invoice fields
  isRecurring: { type: Boolean, default: false },
  recurringCycle: { type: String, enum: ['weekly', 'monthly', 'quarterly'], default: 'monthly' },
  nextInvoiceDate: { type: Date },
  // Razorpay payment tracking
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paymentLink: { type: String },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);