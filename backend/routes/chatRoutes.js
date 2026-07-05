const express = require('express');
const router = express.Router();
const Message = require('../models/chatModel');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { adminMiddleware } = require('../middlewares/adminMiddleware');
const { rateLimits } = require('../middlewares/rateLimit');

// Get messages for a specific room (public)
router.get('/messages/:room', rateLimits.chat, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .sort({ timestamp: 1 })
      .populate('sender', 'name');

    const formattedMessages = messages.map((message) => ({
      _id: message._id,
      sender: message.sender._id,
      senderName: message.senderName,
      content: message.content,
      room: message.room,
      isAdmin: message.isAdmin,
      timestamp: message.timestamp,
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Delete a message (admin only)
router.delete('/messages/:messageId', rateLimits.admin, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.deleteOne();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

module.exports = router; 