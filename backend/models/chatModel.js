const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true,
    enum: ["general", "doubt", "kalvium", "reviews"],
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
messageSchema.index({ room: 1, timestamp: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 