const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: ['Website', 'WhatsApp', 'Instagram', 'Facebook', 'LinkedIn', 'Referral', 'Walk-in', 'Cold Outreach', 'Other'],
      default: 'Website',
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'],
      default: 'New',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    budget: {
      type: Number,
      default: 0,
    },
    requirements: {
      type: String,
      default: '',
    },
    notes: [
      {
        text: { type: String },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    followUpDate: {
      type: Date,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    convertedClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    isConverted: {
      type: Boolean,
      default: false,
    },
    proposalToken: {
      type: String,
    },
    proposalTokenExpires: {
      type: Date,
    },
    proposalSentAt: {
      type: Date,
    },
    proposalAccepted: {
      type: Boolean,
      default: false,
    },
    proposalAcceptedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);