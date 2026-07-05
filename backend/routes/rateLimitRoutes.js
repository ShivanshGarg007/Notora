const express = require('express');
const router = express.Router();
const { rateLimiter, rateLimitInfo, rateLimitReset } = require('../middlewares/rateLimit');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { adminMiddleware } = require('../middlewares/adminMiddleware');

// Get rate limit info for current user/IP
router.get('/info', rateLimitInfo('general'), (req, res) => {
  const type = req.query.type || 'general';
  const limit = rateLimiter.defaultLimits[type];
  
  res.json({
    type,
    limit: limit?.max || 100,
    windowMs: limit?.windowMs || 900000,
    remaining: parseInt(res.get('X-RateLimit-Remaining') || 0),
    resetTime: parseInt(res.get('X-RateLimit-Reset') || 0)
  });
});

router.get('/info/:type', rateLimitInfo('general'), (req, res) => {
  const type = req.params.type;
  const limit = rateLimiter.defaultLimits[type];
  
  res.json({
    type,
    limit: limit?.max || 100,
    windowMs: limit?.windowMs || 900000,
    remaining: parseInt(res.get('X-RateLimit-Remaining') || 0),
    resetTime: parseInt(res.get('X-RateLimit-Reset') || 0)
  });
});

// Get all rate limit types and their configurations
router.get('/config', (req, res) => {
  res.json({
    limits: rateLimiter.defaultLimits,
    description: {
      general: 'General API requests',
      auth: 'Authentication attempts',
      notes: 'Notes API requests',
      notesUpload: 'Note uploads',
      chat: 'Chat messages',
      ocr: 'OCR processing',
      admin: 'Admin operations',
      public: 'Public endpoints'
    }
  });
});

// Admin routes for rate limit management
router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const client = require('../config/redis').getClient();
    const keys = await client.keys('ratelimit:*');
    
    const stats = {};
    for (const key of keys) {
      const parts = key.split(':');
      const type = parts[1];
      const identifier = parts[2];
      const count = await client.get(key);
      
      if (!stats[type]) {
        stats[type] = {};
      }
      
      stats[type][identifier] = parseInt(count) || 0;
    }
    
    res.json({
      totalKeys: keys.length,
      stats,
      summary: Object.keys(stats).map(type => ({
        type,
        activeIdentifiers: Object.keys(stats[type]).length,
        totalRequests: Object.values(stats[type]).reduce((sum, count) => sum + count, 0)
      }))
    });
  } catch (error) {
    console.error('Rate limit stats error:', error);
    res.status(500).json({ error: 'Failed to get rate limit stats' });
  }
});

// Reset rate limit for specific identifier and type
router.post('/admin/reset', authMiddleware, adminMiddleware, rateLimitReset('general'), (req, res) => {
  // The rateLimitReset middleware handles the response
});

// Reset all rate limits for a specific type
router.post('/admin/reset/:type', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const client = require('../config/redis').getClient();
    const keys = await client.keys(`ratelimit:${type}:*`);
    
    if (keys.length > 0) {
      await client.del(keys);
    }
    
    res.json({
      message: `Reset all rate limits for type: ${type}`,
      resetKeys: keys.length
    });
  } catch (error) {
    console.error('Reset all rate limits error:', error);
    res.status(500).json({ error: 'Failed to reset rate limits' });
  }
});

// Reset all rate limits (nuclear option)
router.post('/admin/reset-all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const client = require('../config/redis').getClient();
    const keys = await client.keys('ratelimit:*');
    
    if (keys.length > 0) {
      await client.del(keys);
    }
    
    res.json({
      message: 'Reset all rate limits',
      resetKeys: keys.length
    });
  } catch (error) {
    console.error('Reset all rate limits error:', error);
    res.status(500).json({ error: 'Failed to reset all rate limits' });
  }
});

// Get rate limit info for specific identifier (admin only)
router.get('/admin/info/:identifier', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { identifier } = req.params;
    const type = req.query.type || 'general';
    const info = await rateLimiter.getLimitInfo(identifier, type);
    
    res.json({
      identifier,
      type,
      ...info
    });
  } catch (error) {
    console.error('Get rate limit info error:', error);
    res.status(500).json({ error: 'Failed to get rate limit info' });
  }
});

module.exports = router; 