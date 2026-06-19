const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  clientName: { type: String, required: true, trim: true },
  clientEmail: { type: String, required: true, lowercase: true, trim: true },
  description: { type: String, default: '' },
  terms: { type: String, required: true },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'sent', 'signed'], default: 'draft' },
  signedAt: { type: Date },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Contract', contractSchema);
