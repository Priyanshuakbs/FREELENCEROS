const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'participants.model' },
    model: { type: String, enum: ['User', 'Client'], required: true },
  }],
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  context: {
    type: {
      type: String,
      enum: ['proposal', 'project', 'direct', 'portfolio'],
      default: 'direct',
    },
    title: { type: String, default: '' },
    budget: { type: Number, default: 0 },
    status: { type: String, default: '' },
  },
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageSender: {
    type: mongoose.Schema.Types.ObjectId,
  },
  lastMessageSenderModel: {
    type: String,
    enum: ['User', 'Client'],
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  unreadCounts: {
    freelancer: { type: Number, default: 0 },
    client: { type: Number, default: 0 },
  },
}, { timestamps: true });

conversationSchema.index({ freelancer: 1, client: 1 });
conversationSchema.index({ freelancer: 1, lead: 1 });
conversationSchema.index({ freelancer: 1, project: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
