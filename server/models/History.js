const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['search', 'view', 'compare', 'save'],
    default: 'search'
  }
}, {
  timestamps: true
});

historySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('History', historySchema);
