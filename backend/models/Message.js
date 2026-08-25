const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'senderModel', required: true },
  senderModel: { type: String, required: true, enum: ['User', 'Client'], default: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, refPath: 'receiverModel' },
  receiverModel: { type: String, enum: ['User', 'Client'] },
  text: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ project: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

