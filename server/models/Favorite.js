const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
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
  }
}, {
  timestamps: true
});

favoriteSchema.index({ user: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
