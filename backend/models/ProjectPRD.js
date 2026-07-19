const mongoose = require('mongoose');

const projectPRDSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  version: { type: Number, default: 1 },
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  acceptedAt: { type: Date, default: null },
  acceptedIp: { type: String, default: null },
  status: { type: String, enum: ['draft', 'pending_acceptance', 'accepted'], default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('ProjectPRD', projectPRDSchema);
