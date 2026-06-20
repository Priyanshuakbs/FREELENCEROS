const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, default: '' },
  duration: { type: Number, required: true }, // minutes mein
  hourlyRate: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  billed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('TimeLog', timeLogSchema);