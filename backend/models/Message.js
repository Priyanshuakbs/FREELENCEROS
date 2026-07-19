const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'senderModel', required: true },
  senderModel: { type: String, required: true, enum: ['User', 'Client'], default: 'User' },
  text: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
