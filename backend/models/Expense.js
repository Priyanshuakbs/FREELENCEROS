const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Software', 'Hardware', 'Marketing', 'Office', 'Travel', 'Others'] 
  },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
