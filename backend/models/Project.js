const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  status: { type: String, enum: ['todo', 'in-progress', 'review', 'done'], default: 'todo' },
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'completed', 'on-hold'], default: 'active' },
  budget: { type: Number, default: 0 },
  deadline: { type: Date },
  tasks: [taskSchema],
  shareToken: { type: String, default: null,  sparse: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  files: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    size: { type: Number },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);